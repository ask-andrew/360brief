import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  
  console.log('Auth callback triggered with:', {
    code: code ? 'present' : 'missing',
    state: state || 'missing',
    error: error || 'none'
  });
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', { error, errorDescription });
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'OAuthCallback');
    if (errorDescription) {
      loginUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(loginUrl);
  }
  
  // Verify we have a code
  if (!code) {
    console.error('No code parameter in OAuth callback');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'OAuthCallback');
    loginUrl.searchParams.set('error_description', 'No authorization code received');
    return NextResponse.redirect(loginUrl);
  }
  
  // State is verified by Supabase, but we'll log it for debugging
  if (!state) {
    console.warn('No state parameter in OAuth callback - this is unusual but may be expected with some OAuth providers');
  } else {
    console.log('OAuth state parameter received:', state);
  }
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('Exchanging code for session...');
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      console.error('Error exchanging code for session:', {
        message: authError.message,
        code: authError.code,
        status: authError.status
      });
      throw authError;
    }
    
    if (!session) {
      throw new Error('No session returned after code exchange');
    }
    
    console.log('Successfully exchanged code for session:', {
      userId: session.user?.id,
      provider: session.provider_token ? 'OAuth' : 'Unknown',
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
      refreshToken: !!session.refresh_token
    });
    
    // Verify the session is valid
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Failed to get user after session exchange:', userError);
      throw userError || new Error('Failed to get user after session exchange');
    }
    
    // Determine the redirect path
    let redirectPath = '/dashboard';
    
    // In a server component, we can't access sessionStorage directly
    // Instead, we'll use a cookie to store the redirect path
    const redirectCookie = request.cookies.get('redirect_after_login')?.value;
    if (redirectCookie) {
      try {
        const redirectUrl = new URL(redirectCookie, request.url);
        // Only allow same-origin redirects
        if (redirectUrl.origin === new URL(request.url).origin) {
          redirectPath = redirectUrl.pathname;
        }
      } catch (e) {
        console.warn('Invalid redirect URL in cookie:', e);
      }
    }
    
    console.log('Authentication successful, redirecting to:', redirectPath);
    
    // Create a response that will redirect and clear the redirect cookie
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    
    // Clear the redirect cookie
    response.cookies.delete('redirect_after_login');
    
    return response;
    
  } catch (error) {
    console.error('Error in auth callback:', error);
    
    // Redirect to login with error details
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'authentication_failed');
    
    if (error instanceof Error) {
      loginUrl.searchParams.set('error_details', encodeURIComponent(error.message));
    }
    
    // Clear any redirect cookies on error
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('redirect_after_login');
    
    return response;
  }
}
