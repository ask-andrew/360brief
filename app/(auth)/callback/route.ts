import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { google } from 'googleapis';

// Disable static rendering and caching for this route
export const dynamic = 'force-dynamic';

type OAuthState = {
  redirect?: string;
  user_id?: string;
  account_type?: string;
};

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

// Manual token exchange as fallback when Supabase OAuth doesn't provide tokens
async function captureGmailTokensManually(code: string, user_id: string): Promise<boolean> {
  try {
    console.log('🔄 [Manual Exchange] Starting manual token exchange...');

    // Exchange code directly with Google OAuth
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    console.log('🔍 [Manual Exchange] Token response:', {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      error: tokens.error,
      error_description: tokens.error_description
    });

    if (tokens.access_token) {
      console.log('💾 [Manual Exchange] Storing manually exchanged tokens...');

      const supabase = await createClient();
      const { error } = await supabase
        .from('user_tokens')
        .upsert({
          user_id: user_id,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Math.floor((Date.now() + (tokens.expires_in * 1000)) / 1000),
          scope: tokens.scope || 'https://www.googleapis.com/auth/gmail.readonly',
          token_type: 'Bearer',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        });

      if (!error) {
        console.log('✅ [Manual Exchange] Manual token capture successful');

        // Test the manually captured token
        await testGmailAccess(tokens.access_token);
        return true;
      } else {
        console.error('❌ [Manual Exchange] Failed to store manually captured tokens:', error);
      }
    } else {
      console.error('❌ [Manual Exchange] No access token in manual exchange response:', tokens);
    }
  } catch (error) {
    console.error('❌ [Manual Exchange] Manual token capture failed:', error);
  }
  return false;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorHint = requestUrl.searchParams.get('error_hint');
  const codeVerifier = requestUrl.searchParams.get('code_verifier');
  
  // Parse state for redirect info and check if this is a Google OAuth flow
  let redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`;
  let isGoogleOAuth = false;
  let stateData: OAuthState = {};
  
  if (state) {
    try {
      stateData = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString('utf-8'));
      if (stateData.redirect) {
        redirectUri = stateData.redirect;
      }
      if (stateData.user_id || stateData.account_type) {
        isGoogleOAuth = true;
      }
    } catch (e) {
      console.warn('⚠️ Could not parse state, using default redirect');
    }
  }

  // Log the callback for debugging (but don't log sensitive data)
  console.log('🔄 [Auth Callback] Received callback', {
    code: code ? 'present' : 'missing',
    state: state ? 'present' : 'missing',
    error,
    errorDescription,
    errorCode,
    errorHint,
    hasCodeVerifier: !!codeVerifier,
    redirectUri,
    isGoogleOAuth
  });

  // If there's an error, redirect to login with error details
  if (error) {
    console.error('❌ [Auth Callback] OAuth error:', {
      error,
      errorDescription,
      errorCode,
      errorHint
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
    // Handle Supabase auth callback first
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);

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

    // If this is a Google OAuth flow, handle token exchange
    if (isGoogleOAuth) {
      try {
        console.log('🔄 [Auth Callback] Handling Google OAuth token exchange...');

        // Exchange authorization code for tokens
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        );

        const { tokens } = await oauth2Client.getToken(code);
        
        if (!tokens.access_token) {
          throw new Error('Failed to get access token from Google');
        }

        console.log('✅ [Auth Callback] Received tokens from Google');

        // Get user info to verify identity
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();

        console.log('✅ [Auth Callback] Verified user identity:', userInfo.email);

        // Store tokens in database
        const tokenData = {
          user_id: userId,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          token_type: tokens.token_type || 'Bearer',
          scope: tokens.scope || 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('🔄 [Auth Callback] Storing tokens in database...');
        
        // Use upsert to handle existing tokens
        const { error: tokenError } = await supabase
          .from('user_tokens')
          .upsert(tokenData, {
            onConflict: 'user_id,provider'
          });

        if (tokenError) {
          console.error('❌ [Auth Callback] Failed to store tokens:', tokenError);
          throw new Error(`Database error: ${tokenError.message}`);
        }

        console.log('✅ [Auth Callback] Tokens stored successfully');

        // Update user profile with Google info if needed
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: userInfo.name || session.user.user_metadata?.full_name,
            avatar_url: userInfo.picture || session.user.user_metadata?.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (profileError) {
          console.warn('⚠️ [Auth Callback] Could not update profile:', profileError);
          // Don't fail the whole process for this
        }

        // Add success parameter for Gmail connection
        const successUrl = new URL(redirectUri, requestUrl.origin);
        successUrl.searchParams.set('connected', 'gmail');
        redirectUri = successUrl.toString();

      } catch (googleError) {
        console.error('❌ [Auth Callback] Google OAuth handling error:', googleError);
        // Don't fail the whole auth flow, just log and continue
        const warningUrl = new URL(redirectUri, requestUrl.origin);
        warningUrl.searchParams.set('warning', 'gmail_connection_failed');
        redirectUri = warningUrl.toString();
      }
    } else {
      // Original token handling logic for non-Google OAuth flows
      console.log('🔍 [Auth Callback] Standard OAuth flow, checking for tokens...');
      
      // Check all possible locations for tokens
      const possibleTokens = {
        provider_token: session.provider_token,
        provider_refresh_token: session.provider_refresh_token,
        access_token: session.access_token,
        user_metadata_token: session.user.user_metadata?.provider_token,
        app_metadata_token: session.user.app_metadata?.provider_token,
        // Safely access the first identity's access_token if it exists
        identities_token: Array.isArray(session.user.identities) && 
                         session.user.identities.length > 0 && 
                         'access_token' in session.user.identities[0] 
                          ? (session.user.identities[0] as { access_token: string }).access_token 
                          : undefined
      };

      const gmailToken = possibleTokens.provider_token ||
                        possibleTokens.access_token ||
                        possibleTokens.user_metadata_token ||
                        possibleTokens.app_metadata_token ||
                        possibleTokens.identities_token;

      const gmailRefreshToken = possibleTokens.provider_refresh_token ||
                              session.user.user_metadata?.provider_refresh_token ||
                              session.user.app_metadata?.provider_refresh_token;

      if (gmailToken) {
        console.log('✅ [Auth Callback] Found Gmail token, storing...');
        await storeToken(supabase, userId, gmailToken, gmailRefreshToken, session);
      } else {
        console.warn('⚠️ [Auth Callback] No Gmail token found in standard OAuth flow');
      }
    }

    // Helper function to store token data
    async function storeToken(
      supabase: any,
      userId: string,
      accessToken: string,
      refreshToken: string | null,
      session: any
    ) {
      try {
        // Calculate proper expiry time
        let expiresAt: number;
        if (session.expires_in) {
          // Use expires_in if available (seconds from now)
          expiresAt = Math.floor((Date.now() + (session.expires_in * 1000)) / 1000);
        } else if (session.expires_at) {
          // Use expires_at if it's a timestamp
          expiresAt = session.expires_at;
        } else {
          // Default to 1 hour from now
          expiresAt = Math.floor((Date.now() + 3600 * 1000) / 1000);
        }

        // Store Gmail tokens in user_tokens table
        const tokenData = {
          user_id: userId,
          provider: 'google',
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          scope: session.scope || 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          token_type: 'Bearer',
          updated_at: new Date().toISOString()
        };

        console.log('💾 [Auth Callback] Storing token data:', {
          ...tokenData,
          access_token: `${tokenData.access_token.substring(0, 10)}...`,
          refresh_token: tokenData.refresh_token ? `${tokenData.refresh_token.substring(0, 10)}...` : 'none'
        });

        const { error: tokenError } = await supabase
          .from('user_tokens')
          .upsert(tokenData, {
            onConflict: 'user_id,provider'
          });

        if (tokenError) {
          console.error('❌ [Auth Callback] Failed to store tokens:', tokenError);
          throw tokenError;
        }

        console.log('✅ [Auth Callback] Tokens stored successfully');
        
        // Test Gmail access immediately
        await testGmailAccess(accessToken);
        
      } catch (error) {
        console.error('❌ [Auth Callback] Exception storing tokens:', error);
        throw error;
      }
    }

    // Success! Redirect to the appropriate URL
    console.log('✅ [Auth Callback] Authentication successful, redirecting to:', redirectUri);
    
    // Determine the final redirect URL based on user state
    const finalRedirect = session.user.user_metadata?.onboarding_completed === false 
      ? '/onboarding'
      : redirectUri;
      
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
