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
      expires_at: expiresAtSeconds ? new Date(expiresAtSeconds * 1000).toISOString() : null,
      updated_at: new Date(updatedAtSeconds * 1000).toISOString(),
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

      });
      
      redirectUrl.searchParams.set('auth', 'error');
      redirectUrl.searchParams.set('message', `Failed to save Gmail connection: ${tokenError.message}`);
      return NextResponse.redirect(redirectUrl);
    } else {
      console.log('✅ Gmail tokens stored successfully', insertData?.length ? `(${insertData.length} records)` : '');
    }
    
    // Update user metadata to mark Gmail as connected AND create authenticated session
    console.log('🔐 Updating user metadata and creating authenticated session...');

    try {
      console.log(`🔍 Updating metadata and creating session for user: ${user.id}`);

      // Update user metadata to mark Gmail as connected
      const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          gmail_connected: true,
          gmail_email: googleUser.email,
          connected_at: new Date().toISOString()
        }
      });

      if (updateError) {
        console.error('⚠️ Failed to update user metadata:', updateError);
        // Don't fail the whole flow for this
      } else {
        console.log('✅ User metadata updated successfully');
      }

      // Create authenticated session using direct approach
      console.log('🔄 Creating authenticated session for unified OAuth flow...');

      // Create SSR client for proper session management
      const ssrSupabase = await createClient();

      try {
        // Use admin to create a session directly for this user
        console.log('🔐 Creating session using admin.createUser approach...');

        // Since user already exists, we need to sign them in
        // First, set a temporary password and sign them in
        const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Update user with temporary password
        const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(user.id, {
          password: tempPassword
        });

        if (updateError) {
          console.error('❌ Failed to set temporary password:', updateError);
          throw updateError;
        }

        console.log('✅ Temporary password set, signing in user...');

        // Sign in using the SSR client
        const { data: signInData, error: signInError } = await ssrSupabase.auth.signInWithPassword({
          email: user.email!,
          password: tempPassword
        });

        if (signInError) {
          console.error('❌ Failed to sign in user:', signInError);
          throw signInError;
        }

        console.log('✅ User signed in successfully via SSR client');

        // Create redirect response - the session is now set in cookies
        const response = NextResponse.redirect(`${request.url.split('/api')[0]}/dashboard?connected=gmail&status=success`);
        return response;

      } catch (sessionError) {
        console.error('❌ Failed to create session:', sessionError);
        // Continue to fallback redirect
      }

      // Success! Redirect back to dashboard with success parameters
      console.log('✅ Gmail connection successful, redirecting to dashboard');
      redirectUrl.pathname = '/dashboard';
      redirectUrl.searchParams.set('connected', 'gmail');
      redirectUrl.searchParams.set('status', 'success');
      return NextResponse.redirect(redirectUrl);

    } catch (sessionCreateError) {
      console.error('❌ Failed to complete Gmail connection:', sessionCreateError);

      // Even if session creation fails, Gmail tokens are stored, so redirect with partial success
      redirectUrl.pathname = '/dashboard';
      redirectUrl.searchParams.set('connected', 'gmail');
      redirectUrl.searchParams.set('status', 'partial');
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