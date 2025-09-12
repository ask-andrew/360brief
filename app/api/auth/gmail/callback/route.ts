import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getOAuthClient } from '@/server/google/client';
import { createClient } from '@/lib/supabase/server';
import { normalizeToSeconds } from '@/lib/utils/timestamp';

// Force Node.js runtime for service role operations
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const redirectUrl = new URL('/dashboard', request.url);

  try {
    if (error) {
      console.error('❌ Gmail OAuth error:', error);
      redirectUrl.searchParams.set('auth', 'error');
      redirectUrl.searchParams.set('message', error);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
      redirectUrl.searchParams.set('auth', 'error');
      redirectUrl.searchParams.set('message', 'No authorization code received');
      return NextResponse.redirect(redirectUrl);
    }

    console.log('🔄 Gmail callback received code, exchanging for tokens and creating user...');

    // Exchange code for tokens using direct Next.js implementation
    const tokens = await exchangeCodeForTokens(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Invalid tokens received from Google');
    }

    // Get user profile from Google to create/find user in Supabase
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(tokens);
    
    const { google } = await import('googleapis');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: googleUser } = await oauth2.userinfo.get();
    
    console.log('🔍 Google user data received:', {
      email: googleUser.email,
      name: googleUser.name,
      id: googleUser.id,
      picture: googleUser.picture ? 'Present' : 'Missing',
    });
    
    if (!googleUser.email) {
      throw new Error('No email received from Google');
    }
    
    // Create Supabase service client to handle authentication
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Find or create user in Supabase auth
    let user: any;
    
    // Try to find existing user by email
    console.log(`🔍 Looking for existing user with email: ${googleUser.email}`);
    const { data: existingUsers, error: listError } = await serviceSupabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', {
        code: listError.code,
        message: listError.message,
        details: listError.details,
      });
    }
    
    const existingUser = existingUsers?.users?.find(u => u.email === googleUser.email);
    console.log(`🔍 Found ${existingUsers?.users?.length || 0} total users, existing user: ${existingUser ? 'YES' : 'NO'}`);
    
    if (existingUser) {
      user = existingUser;
      console.log(`✅ Found existing Supabase user: ${user.id}`);
    } else {
      // Create new user in Supabase
      const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
        email: googleUser.email,
        user_metadata: {
          name: googleUser.name,
          avatar_url: googleUser.picture,
          provider: 'google',
          google_id: googleUser.id,
        },
        email_confirm: true, // Auto-confirm since Google already verified the email
      });
      
      if (createError) {
        console.error('❌ Failed to create Supabase user:', {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          email: googleUser.email,
        });
        throw new Error(`Failed to create user account: ${createError.message}`);
      }
      
      user = newUser.user;
      console.log(`✅ Created new Supabase user: ${user.id}`);
    }
    
    if (!user) {
      throw new Error('Failed to get or create user');
    }
    
    // Create a session for the user using admin.createUser with auto-confirm
    // This will automatically sign them in if they're a new user
    console.log('🔄 Creating authenticated session for user...');

    // Ensure profile exists
    const { data: profileData, error: profileError } = await serviceSupabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        email: user.email || '',
        full_name: googleUser.name,
        avatar_url: googleUser.picture,
      })
      .select()
      .single();

    if (profileError) {
      console.warn('⚠️ Warning: Could not create/update profile:', profileError);
    }

    console.log('🔄 Storing Gmail tokens in Supabase...');
    
    // Handle mixed schema: test individual fields
    const expiresAtSeconds = tokens.expiry_date ? normalizeToSeconds(tokens.expiry_date) : null;
    const updatedAtSeconds = normalizeToSeconds(Date.now());
    
    // First attempt: try both as bigint (Unix seconds)
    const tokenData = {
      user_id: user.id,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAtSeconds,
      updated_at: updatedAtSeconds,
    };
    
    console.log(`🔍 Storing token data:`, {
      user_id: tokenData.user_id,
      provider: tokenData.provider,
      expires_at: tokenData.expires_at,
      expires_at_type: typeof tokenData.expires_at,
      expires_at_seconds: expiresAtSeconds,
      updated_at: tokenData.updated_at,
      updated_at_type: typeof tokenData.updated_at,
      updated_at_seconds: updatedAtSeconds,
      expires_raw: tokens.expiry_date,
      expires_raw_type: typeof tokens.expiry_date,
      access_token_length: tokenData.access_token?.length,
      refresh_token_length: tokenData.refresh_token?.length,
    });
    
    const { data: insertData, error: tokenError } = await serviceSupabase
      .from('user_tokens')
      .upsert(tokenData, {
        onConflict: 'user_id,provider'
      })
      .select();

    if (tokenError) {
      console.error('❌ Token insert error:', {
        code: tokenError.code,
        message: tokenError.message,
        details: tokenError.details,
        hint: tokenError.hint,
      });
      
      // Handle mixed schema: try different field type combinations
      if (tokenError.code === '22008' || tokenError.code === '22P02') {
        console.log('🔄 First attempt failed, trying alternative field formats...');
        
        // Try different combinations:
        const retryOptions = [
          // Option 1: expires_at as timestamp, updated_at as bigint
          {
            name: 'expires_at=timestamp, updated_at=bigint',
            data: {
              ...tokenData,
              expires_at: expiresAtSeconds ? new Date(expiresAtSeconds * 1000).toISOString() : null,
              updated_at: updatedAtSeconds,
            }
          },
          // Option 2: expires_at as bigint, updated_at as timestamp  
          {
            name: 'expires_at=bigint, updated_at=timestamp',
            data: {
              ...tokenData,
              expires_at: expiresAtSeconds,
              updated_at: new Date(updatedAtSeconds * 1000).toISOString(),
            }
          },
          // Option 3: both as timestamp
          {
            name: 'both=timestamp',
            data: {
              ...tokenData,
              expires_at: expiresAtSeconds ? new Date(expiresAtSeconds * 1000).toISOString() : null,
              updated_at: new Date(updatedAtSeconds * 1000).toISOString(),
            }
          }
        ];
        
        let retrySuccess = false;
        
        for (const option of retryOptions) {
          console.log(`🔄 Trying ${option.name}...`);
          
          const { data: retryData, error: retryError } = await serviceSupabase
            .from('user_tokens')
            .upsert(option.data, {
              onConflict: 'user_id,provider'
            })
            .select();
            
          if (!retryError) {
            console.log(`✅ Success with ${option.name}!`, retryData?.length ? `(${retryData.length} records)` : '');
            retrySuccess = true;
            break;
          } else {
            console.log(`❌ ${option.name} failed:`, retryError.message);
          }
        }
        
        if (!retrySuccess) {
          console.error('❌ All retry attempts failed');
          redirectUrl.searchParams.set('auth', 'error');
          redirectUrl.searchParams.set('message', `Failed to save Gmail connection: All timestamp format attempts failed`);
          return NextResponse.redirect(redirectUrl);
        }
      }
      // More specific error handling for common issues  
      else if (tokenError.code === '23505') {
        console.log('🔄 Duplicate key error - attempting direct update...');
        
        // Try direct update instead of upsert
        const updateData = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
          updated_at: normalizeToSeconds(Date.now()), // Try bigint first
        };
        
        console.log('🔍 Update data types:', {
          expires_at: updateData.expires_at,
          expires_at_type: typeof updateData.expires_at,
          updated_at: updateData.updated_at,
          updated_at_type: typeof updateData.updated_at,
        });

        const { error: updateError } = await serviceSupabase
          .from('user_tokens')
          .update(updateData)
          .eq('user_id', user.id)
          .eq('provider', 'google');
          
        if (updateError) {
          console.error('❌ Token update also failed:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
          });
          redirectUrl.searchParams.set('auth', 'error');
          redirectUrl.searchParams.set('message', `Failed to save Gmail connection: ${updateError.message}`);
          return NextResponse.redirect(redirectUrl);
        }
        
        console.log('✅ Gmail tokens updated successfully after duplicate error');
      } else {
        redirectUrl.searchParams.set('auth', 'error');
        redirectUrl.searchParams.set('message', `Failed to save Gmail connection: ${tokenError.message}`);
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      console.log('✅ Gmail tokens stored successfully', insertData?.length ? `(${insertData.length} records)` : '');
    }
    
    // Create proper Supabase session using service role
    console.log('🔐 Creating Supabase session for Gmail OAuth user...');
    
    try {
      // Use service role client to create a session
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      // Generate session for the user
      const { data: sessionData, error: sessionError } = await serviceSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email!,
        options: {
          data: {
            gmail_connected: true,
            connected_at: new Date().toISOString()
          }
        }
      });
      
      if (sessionError || !sessionData.properties?.action_link) {
        console.error('❌ Failed to generate session link:', sessionError);
        throw new Error('Failed to create user session');
      }
      
      // Extract token from the magic link and redirect through Supabase auth callback
      const linkUrl = new URL(sessionData.properties.action_link);
      const token = linkUrl.searchParams.get('token_hash');
      const type = linkUrl.searchParams.get('type');
      
      if (token && type) {
        // Redirect to Supabase auth callback with the session token
        const callbackUrl = new URL('/auth/callback', request.url);
        callbackUrl.searchParams.set('token_hash', token);
        callbackUrl.searchParams.set('type', type);
        callbackUrl.searchParams.set('next', '/dashboard');
        callbackUrl.searchParams.set('connect', 'gmail'); // Signal this was a Gmail connection
        
        console.log('✅ Redirecting to Supabase auth callback with session token');
        return NextResponse.redirect(callbackUrl);
      } else {
        throw new Error('Could not extract session token from magic link');
      }
      
    } catch (sessionCreateError) {
      console.error('❌ Session creation failed:', sessionCreateError);
      
      // Fallback: redirect to login with success message but require re-auth
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('auth', 'gmail_connected');
      redirectUrl.searchParams.set('message', 'Gmail connected! Please sign in to continue.');
      return NextResponse.redirect(redirectUrl);
    }
    
  } catch (error) {
    console.error('❌ Gmail Callback Error:', error);
    
    redirectUrl.searchParams.set('auth', 'error');
    redirectUrl.searchParams.set('message', 
      error instanceof Error ? error.message : 'Gmail connection failed'
    );
    return NextResponse.redirect(redirectUrl);
  }
}