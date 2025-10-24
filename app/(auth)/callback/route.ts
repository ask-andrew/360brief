import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

// Disable static rendering and caching for this route
export const dynamic = 'force-dynamic';

// Test Gmail access immediately after token storage
async function testGmailAccess(accessToken: string) {
  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[Gmail Test] ✅ Gmail test successful: ${data.messages?.length || 0} messages found`);
      return true;
    } else {
      console.error('[Gmail Test] ❌ Gmail test failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('[Gmail Test] ❌ Gmail test error:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // If there's an error, redirect to login with error details
  if (error) {
    console.error('❌ [Auth Callback] OAuth error:', {
      error,
      errorDescription
    });

    const redirectUrl = new URL('/login', requestUrl.origin);
    redirectUrl.searchParams.set('error', 'oauth_failed');
    if (errorDescription) redirectUrl.searchParams.set('error_description', errorDescription);
    return NextResponse.redirect(redirectUrl);
  }

  // If there's no code, redirect to login
  if (!code) {
    console.error('❌ [Auth Callback] No code provided in callback');
    const redirectUrl = new URL('/login', requestUrl.origin);
    redirectUrl.searchParams.set('error', 'no_code');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = await createClient();

    // Handle standard Supabase OAuth callback
    console.log('🔄 [Auth Callback] Exchanging code for session...');
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error('❌ [Auth Callback] Error exchanging code for session:', authError);
      throw authError;
    }

    // Get the user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error('❌ [Auth Callback] No valid session found:', sessionError);
      const redirectUrl = new URL('/login', requestUrl.origin);
      redirectUrl.searchParams.set('error', 'no_session');
      return NextResponse.redirect(redirectUrl);
    }

    const userId = session.user.id;
    console.log('✅ [Auth Callback] Found user session:', userId);

    // Check if tokens are available in the session
    const providerToken = session.provider_token;
    const providerRefreshToken = session.provider_refresh_token;

    if (providerToken) {
      console.log('✅ [Auth Callback] Found provider tokens in session');

      // Store tokens in database
      const tokenData = {
        user_id: userId,
        provider: 'google',
        access_token: providerToken,
        refresh_token: providerRefreshToken || null,
        expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
        token_type: 'Bearer',
        updated_at: new Date().toISOString()
      };

      console.log('💾 [Auth Callback] Storing tokens in database...');

      const { error: tokenError } = await supabase
        .from('user_tokens')
        .upsert(tokenData, {
          onConflict: 'user_id,provider'
        });

      if (tokenError) {
        console.error('❌ [Auth Callback] Failed to store tokens:', tokenError);
        // Don't fail the whole flow for token storage errors
      } else {
        console.log('✅ [Auth Callback] Tokens stored successfully');
      }

      // Update user profile with provider info
      if (session.user.user_metadata) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: session.user.user_metadata.full_name || session.user.user_metadata.name,
            avatar_url: session.user.user_metadata.avatar_url || session.user.user_metadata.picture,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (profileError) {
          console.warn('⚠️ [Auth Callback] Could not update profile:', profileError);
        }
      }

      // Test Gmail access if token is available
      if (providerToken) {
        await testGmailAccess(providerToken);
      }

    } else {
      console.warn('⚠️ [Auth Callback] No provider tokens found in session');
    }

    // Success! Redirect to dashboard
    console.log('✅ [Auth Callback] Authentication successful, redirecting to dashboard');

    const finalRedirect = session.user.user_metadata?.onboarding_completed === false
      ? '/onboarding'
      : '/dashboard';

    return NextResponse.redirect(new URL(finalRedirect, requestUrl.origin));
  } catch (error) {
    console.error('❌ [Auth Callback] Error during authentication:', error);
    
    // Redirect to error page with details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const encodedError = encodeURIComponent(errorMessage);
    
    const redirectUrl = new URL('/login', requestUrl.origin);
    redirectUrl.searchParams.set('error', 'auth_error');
    redirectUrl.searchParams.set('error_description', encodedError);
    
    return NextResponse.redirect(redirectUrl);
  }
}
