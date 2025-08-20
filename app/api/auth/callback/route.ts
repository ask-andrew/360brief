import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Helper to verify state parameter for CSRF protection
const verifyState = (state: string | null, request: NextRequest): { valid: boolean; error?: string } => {
  if (!state) {
    return { valid: false, error: 'Missing state parameter' };
  }
  
  // Get the state from the cookie
  const stateCookie = request.cookies.get('oauth_state')?.value;
  
  // In development, log the state and cookie for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Verifying state:', { state, stateCookie });
  }
  
  if (!stateCookie) {
    return { 
      valid: false, 
      error: 'Missing state cookie. Please try signing in again.' 
    };
  }
  
  if (stateCookie !== state) {
    return { 
      valid: false, 
      error: 'State mismatch. Possible CSRF attack.' 
    };
  }
  
  return { valid: true };
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  
  // Log incoming request for debugging
  console.log('Auth callback received:', {
    hasCode: !!code,
    hasState: !!state,
    hasError: !!error,
    error,
    errorDescription,
    next,
    cookies: request.cookies.getAll().map(c => c.name)
  });
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', { error, errorDescription });
    const errorUrl = new URL('/login', requestUrl.origin);
    errorUrl.searchParams.set('error', error);
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(errorUrl);
  }

  // Verify state parameter for CSRF protection
  const stateVerification = verifyState(state, request);
  if (!stateVerification.valid) {
    console.error('Invalid state parameter:', { 
      state, 
      error: stateVerification.error,
      stateCookie: request.cookies.get('oauth_state')?.value,
      allCookies: request.cookies.getAll()
    });
    
    const errorUrl = new URL('/login', requestUrl.origin);
    errorUrl.searchParams.set('error', 'invalid_state');
    errorUrl.searchParams.set('error_description', stateVerification.error || 'Invalid state parameter');
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    console.error('No code parameter found in callback URL');
    const errorUrl = new URL('/login', requestUrl.origin);
    errorUrl.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(errorUrl);
  }
  
  try {
    console.log('Creating Supabase client...');
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Exchange the code for a session using PKCE flow
    console.log('Exchanging code for session...');
    const { 
      data: { session }, 
      error: authError 
    } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      console.error('Error exchanging code:', authError);
      throw authError;
    }
    
    if (!session) {
      console.error('No session returned from exchangeCodeForSession');
      throw new Error('Failed to create session: No session data returned');
    }
    
    console.log('Session created successfully:', {
      user: session.user?.email,
      expiresAt: session.expires_at,
      refreshToken: !!session.refresh_token
    });
    
    console.log('Session created successfully for user:', session.user?.email);
    
    // Create a response that will handle the redirect
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    
    // Clear the state cookie
    response.cookies.delete('oauth_state');
    
    return response;

  } catch (error) {
    console.error('Authentication error:', error);
    const errorUrl = new URL('/login', requestUrl.origin);
    errorUrl.searchParams.set('error', 'authentication_failed');
    
    if (error instanceof Error) {
      errorUrl.searchParams.set('error_description', error.message);
    }
    
    return NextResponse.redirect(errorUrl);
  }
}