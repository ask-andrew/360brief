import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getOAuthClient } from '@/server/google/client';
import { createClient } from '@/lib/supabase/server';

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
    const { data: existingUsers } = await serviceSupabase.auth.admin.listUsers();
    const existingUser = existingUsers.users?.find(u => u.email === googleUser.email);
    
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
        console.error('❌ Failed to create Supabase user:', createError);
        throw new Error('Failed to create user account');
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
    
    const tokenData = {
      user_id: user.id,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null, // Convert Google's milliseconds to Unix seconds
      updated_at: Math.floor(Date.now() / 1000), // Store as Unix timestamp
    };
    
    console.log(`🔍 Storing token data:`, {
      user_id: tokenData.user_id,
      provider: tokenData.provider,
      expires_at: tokenData.expires_at,
      expires_raw: tokens.expiry_date,
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
      
      // More specific error handling for common issues
      if (tokenError.code === '23505') {
        console.log('🔄 Duplicate key error - attempting direct update...');
        
        // Try direct update instead of upsert
        const { error: updateError } = await serviceSupabase
          .from('user_tokens')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: tokenData.expires_at,
            updated_at: Math.floor(Date.now() / 1000), // Store as Unix timestamp
          })
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
    
    // Create manual session by setting JWT tokens in cookies
    // For now, let's redirect with user ID so the frontend can create the session
    redirectUrl.searchParams.set('user_id', user.id);
    
    // Redirect to dashboard with success message
    redirectUrl.searchParams.set('auth', 'success');
    redirectUrl.searchParams.set('message', 'Gmail connected successfully!');
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ Gmail Callback Error:', error);
    
    redirectUrl.searchParams.set('auth', 'error');
    redirectUrl.searchParams.set('message', 
      error instanceof Error ? error.message : 'Gmail connection failed'
    );
    return NextResponse.redirect(redirectUrl);
  }
}