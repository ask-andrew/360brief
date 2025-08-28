import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';

// Disable static rendering and caching for this route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorHint = requestUrl.searchParams.get('error_hint');
  const codeVerifier = requestUrl.searchParams.get('code_verifier');

  // Log the callback for debugging (but don't log sensitive data)
  console.log('[Auth Callback] Received callback', {
    code: code ? 'present' : 'missing',
    hasCodeVerifier: !!codeVerifier,
    error,
    errorCode,
    url: requestUrl.origin + requestUrl.pathname // Don't log query params
  });

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', { 
      error, 
      errorDescription,
      errorCode,
      errorHint,
      url: requestUrl.toString()
    });
    
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', error || 'oauth_error');
    if (errorDescription) redirectUrl.searchParams.set('error_description', errorDescription);
    if (errorCode) redirectUrl.searchParams.set('error_code', errorCode);
    
    return NextResponse.redirect(redirectUrl);
  }

  // If no code is present, redirect to login with an error
  if (!code) {
    const errorMsg = 'No OAuth code found in callback URL';
    console.error(`[Auth Callback] ${errorMsg}`);
    
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'invalid_oauth_code');
    redirectUrl.searchParams.set('error_description', encodeURIComponent(errorMsg));
    
    return NextResponse.redirect(redirectUrl);
  }

  try {
    console.log('[Auth Callback] Exchanging code for session...');
    
    // Create a new Supabase client for the server (pass async cookies() fn)
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Exchange the auth code for a session
    const { data: { session: authSession }, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !authSession) {
      console.error('[Auth Callback] Error exchanging code for session:', authError || 'No session returned');
      throw authError || new Error('No session returned from exchange');
    }
    
    console.log('[Auth Callback] Session exchange successful for user:', {
      userId: authSession.user.id,
      email: authSession.user.email,
      expiresAt: authSession.expires_at
    });

    // Get the current session to verify the user is authenticated
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !currentSession) {
      const errorMsg = 'No session established after OAuth callback';
      console.error(`[Auth Callback] ${errorMsg}:`, sessionError);
      throw new Error(errorMsg);
    }
    
    console.log('[Auth Callback] Successfully authenticated user:', {
      userId: currentSession.user.id,
    });

    // Get the redirect URL from localStorage (set by the login page) or default to dashboard
    const defaultRedirect = '/dashboard';
    let redirectTo = defaultRedirect;
    
    try {
      // In a real app, you might want to validate this URL to prevent open redirects
      const storedRedirect = request.headers.get('referer');
      if (storedRedirect) {
        const storedUrl = new URL(storedRedirect);
        const authRedirect = storedUrl.searchParams.get('redirectedFrom');
        if (authRedirect && authRedirect.startsWith('/')) {
          redirectTo = authRedirect;
        }
      }
    } catch (e) {
      console.warn('[Auth Callback] Error parsing redirect URL, using default');
    }
    
    const redirectUrl = new URL(redirectTo, request.url);
    
    // Clean up any sensitive params from the URL
    const paramsToRemove = [
      'code', 'error', 'error_description', 'error_code', 'error_hint',
      'state', 'provider', 'type', 'next'
    ];
    
    paramsToRemove.forEach(param => {
      redirectUrl.searchParams.delete(param);
    });
    
    console.log(`[Auth Callback] Redirecting to: ${redirectUrl.toString()}`);
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('[Auth Callback] Unhandled error:', error);
    
    // Create a safe error message
    let errorMessage = 'An unexpected error occurred during authentication';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Redirect to login with error details
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'authentication_failed');
    redirectUrl.searchParams.set('error_description', encodeURIComponent(errorMessage));
    
    // Add error details for debugging (only in development)
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      redirectUrl.searchParams.set('error_stack', encodeURIComponent(error.stack || ''));
    }
    
    return NextResponse.redirect(redirectUrl);
  }
}
