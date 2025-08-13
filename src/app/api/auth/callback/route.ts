import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';
import env from '@/config/env';

// Constants
const SESSION_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

// Types
type OAuthError = {
  error: string;
  error_description?: string;
  state?: string | null;
};

// Utility functions
const logEvent = (event: string, data?: Record<string, unknown>) => {
  console.log(`[Auth Callback] ${event}`, JSON.stringify(data || {}, null, 2));
};

const createErrorResponse = (error: OAuthError, baseUrl: string) => {
  const { error: errorCode, error_description: description, state } = error;
  const url = new URL('/login', baseUrl);
  
  if (errorCode) url.searchParams.set('error', errorCode);
  if (description) url.searchParams.set('error_description', description);
  if (state) url.searchParams.set('state', state);
  
  return NextResponse.redirect(url);
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let response = NextResponse.redirect(new URL('/dashboard', baseUrl));
  
  try {
    // Log the incoming request
    logEvent('Incoming OAuth callback', {
      url: requestUrl.toString(),
      method: request.method,
    });
    
    // Parse URL parameters
    const searchParams = requestUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const state = searchParams.get('state');
    
    // Check for OAuth errors first
    if (error) {
      logEvent('OAuth error in callback', { error, errorDescription, state });
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || 'Unknown error')}`,
          baseUrl
        )
      );
    }
    
    // Verify state parameter to prevent CSRF
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key.trim()] = value;
      }
      return acc;
    }, {});
    
    const storedState = cookies['oauth_state'];
    
    // Debug log for cookie parsing
    console.log('Parsed cookies:', cookies);
    console.log('Looking for oauth_state in cookies');
    
    if (!state || !storedState || state !== storedState) {
      logEvent('Invalid or missing state parameter', { 
        receivedState: state,
        storedState,
        cookies: Object.keys(cookies),
        error: 'state_mismatch'
      });
      
      const errorResponse = NextResponse.redirect(
        new URL(
          `/login?error=invalid_state&error_description=${encodeURIComponent('Invalid or expired session. Please try signing in again.')}`,
          baseUrl
        )
      );
      
      // Clear the state cookie
      errorResponse.cookies.set({
        name: 'oauth_state',
        value: '',
        path: '/',
        expires: new Date(0),
      });
      
      return errorResponse;
    }
    
    // Clear the state cookie after verification
    response.cookies.set({
      name: 'oauth_state',
      value: '',
      path: '/',
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    });
    
    // Verify we have an authorization code
    if (!code) {
      logEvent('Missing authorization code in callback');
      return NextResponse.redirect(
        new URL('/login?error=missing_code&error_description=No authorization code received', baseUrl)
      );
    }
    
    // Log the extracted parameters (without sensitive data)
    logEvent('Processing OAuth callback', {
      hasCode: !!code,
      hasState: !!state,
    });
    
    // Parse cookies to get the code verifier
    const requestCookies = request.headers.get('cookie') || '';
    const cookieMap = requestCookies.split(';').reduce<Record<string, string>>((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key.trim()] = decodeURIComponent(value);
      }
      return acc;
    }, {});
    
    const codeVerifier = cookieMap['code_verifier'];
    
    if (!codeVerifier) {
      logEvent('Missing code_verifier in cookies', { cookies: Object.keys(cookieMap) });
      return NextResponse.redirect(
        new URL('/login?error=invalid_request&error_description=Missing authentication session data', baseUrl)
      );
    }
    
    // Create a Supabase client for the server-side code exchange
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    }, {
      options: {
        auth: {
          flowType: 'pkce',
          debug: process.env.NODE_ENV !== 'production',
        },
      },
    });
    
    // Exchange the authorization code for a session with PKCE
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession({
      auth: {
        code_verifier: codeVerifier,
      },
      code,
    });
    
    // Clear the code verifier cookie after use
    response.cookies.set({
      name: 'code_verifier',
      value: '',
      path: '/',
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    });
    
    if (authError || !session) {
      logEvent('Error exchanging code for session', { 
        error: authError?.message || 'No session returned',
        code: authError?.code
      });
      throw authError || new Error('Failed to exchange code for session');
    }
    
    // Log successful authentication
    logEvent('Successfully authenticated user', {
      userId: session.user?.id,
      email: session.user?.email,
      expiresAt: session.expires_in,
    });

    // Set the auth cookies
    response = NextResponse.redirect(new URL('/dashboard', baseUrl));
    
    // Set the access token cookie
    response.cookies.set({
      name: 'sb-access-token',
      value: session.access_token,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.expires_in || SESSION_COOKIE_OPTIONS.maxAge,
    });
    
    // Set the refresh token cookie if available
    if (session.refresh_token) {
      response.cookies.set({
        name: 'sb-refresh-token',
        value: session.refresh_token,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
    }
    
    // Also set the auth-token cookie that some Supabase clients might expect
    response.cookies.set({
      name: 'sb-auth-token',
      value: session.access_token,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: session.expires_in || SESSION_COOKIE_OPTIONS.maxAge,
    });
    
    // Handle user profile creation/update
    try {
      // Try to get the user profile
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();
        
        // If profile doesn't exist, create it
        if (profileError || !profile) {
          logEvent('Creating new user profile', { userId: session.user.id });
          
          // Insert the profile with type assertion
          const profileData = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString(),
          };
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(profileData as any);
          
          if (insertError) {
            logEvent('Error creating user profile', { error: insertError });
            throw insertError;
          }
          
          logEvent('Successfully created user profile', { userId: session.user.id });
        }
      } catch (profileError) {
        console.error('Error in profile handling:', profileError);
        // Don't fail the auth flow if profile update fails
      }
    } catch (profileError) {
      console.error('Error handling user profile:', profileError);
      // Don't fail the auth flow if profile update fails
    }
    
    // Handle redirect after successful auth
    let redirectPath = '/dashboard';
    try {
      // Check for redirect URL in cookies first (set by the login page)
      const redirectFromCookie = cookieMap['redirect_after_login'];
      if (redirectFromCookie) {
        const url = new URL(redirectFromCookie, baseUrl);
        // Only allow redirects to the same origin for security
        if (url.origin === new URL(baseUrl).origin) {
          redirectPath = redirectFromCookie;
        }
      }
      // Fall back to state parameter if no cookie is set
      else if (state && state !== '/' && !state.startsWith('http')) {
        const url = new URL(state, baseUrl);
        // Only allow redirects to the same origin for security
        if (url.origin === new URL(baseUrl).origin) {
          redirectPath = state;
        }
      }
    } catch (e) {
      console.warn('Invalid redirect URL:', e);
    }
    
    // Update the redirect URL if needed
    if (redirectPath !== '/dashboard') {
      response = NextResponse.redirect(new URL(redirectPath, baseUrl), {
        headers: response.headers,
      });
    }
    
    logEvent('Authentication successful', {
      userId: session.user?.id,
      redirectTo: redirectPath,
    });
    
    return response;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    logEvent('Authentication error', { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Clear any sensitive cookies on error
    const errorResponse = NextResponse.redirect(
      new URL(
        `/login?error=auth_error&error_description=${encodeURIComponent(errorMessage)}`,
        baseUrl
      )
    );
    
    errorResponse.cookies.delete('sb-access-token');
    errorResponse.cookies.delete('sb-refresh-token');
    errorResponse.cookies.delete('sb-auth-token');
    errorResponse.cookies.delete('oauth_state');
    
    return errorResponse;
  }
}
