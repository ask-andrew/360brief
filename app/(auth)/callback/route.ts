import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  // Log the callback for debugging (but don't log sensitive data)
  console.log('[Auth Callback] Received callback', {
    code: code ? 'present' : 'missing',
    error,
    errorDescription,
    errorCode,
    errorHint,
    hasCodeVerifier: !!codeVerifier,
    next
  });

  // If there's an error, redirect to login with error details
  if (error) {
    console.error('[Auth Callback] OAuth error:', {
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
    console.error('[Auth Callback] No code provided in callback');
    const redirectUrl = new URL('/login', requestUrl.origin);
    redirectUrl.searchParams.set('error', 'no_code');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error('[Auth Callback] Error exchanging code for session:', authError);
      throw authError;
    }

    // Get the user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('[Auth Callback] Error getting session:', sessionError);
      throw new Error('Failed to get user session');
    }

    // Success! Redirect to the dashboard or the next URL
    console.log('[Auth Callback] Authentication successful, redirecting to:', next);
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    console.error('[Auth Callback] Error during authentication:', error);
    const redirectUrl = new URL('/login', requestUrl.origin);
    redirectUrl.searchParams.set('error', 'auth_error');
    if (error instanceof Error) {
      redirectUrl.searchParams.set('error_description', error.message);
    }
    return NextResponse.redirect(redirectUrl);
  }
}
