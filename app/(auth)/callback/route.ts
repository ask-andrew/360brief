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
    redirectUrl.searchParams.set('error', 'invalid_request');
    redirectUrl.searchParams.set('error_description', encodeURIComponent(errorMsg));
    
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Create a Supabase client configured to use cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Exchange the code for a session
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error('[Auth Callback] Error exchanging code for session:', authError);
      throw authError;
    }

    // Get the user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('[Auth Callback] Error getting session:', sessionError);
      throw sessionError || new Error('No session found after authentication');
    }

    console.log('[Auth Callback] User authenticated successfully:', {
      userId: session.user.id,
      email: session.user.email,
      provider: session.user.app_metadata.provider
    });

    // Check if the user needs to complete signup
    const needsSignup = !session.user.user_metadata?.full_name;
    
    // Redirect to the appropriate page
    const redirectTo = needsSignup 
      ? '/onboarding'
      : requestUrl.searchParams.get('redirect_to') || '/dashboard';

    return NextResponse.redirect(new URL(redirectTo, request.url));

  } catch (error) {
    console.error('[Auth Callback] Error during authentication:', error);
    
    // Create a safe error message for the client
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    // Redirect to login with error details
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'authentication_failed');
    redirectUrl.searchParams.set('error_description', encodeURIComponent(errorMessage));
    
    return NextResponse.redirect(redirectUrl);
  }
}
