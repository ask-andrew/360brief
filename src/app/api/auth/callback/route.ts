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
  // Log the start of the callback
  const requestUrl = new URL(request.url);
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Log the incoming request
  logEvent('Incoming OAuth callback', {
    url: requestUrl.toString(),
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  });
  
  // Parse URL parameters
  const searchParams = requestUrl.searchParams;
  let code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');
  
  // Log the extracted parameters
  logEvent('Extracted URL parameters', {
    hasCode: !!code,
    error,
    errorDescription,
    hasState: !!state,
  });
  
  // Handle OAuth errors first
  if (error) {
    logEvent('OAuth error received', { error, errorDescription, state });
    return createErrorResponse({ error, error_description: errorDescription, state }, baseUrl);
  }
  
  // Check for hash fragment (implicit flow fallback)
  if (!code && requestUrl.hash) {
    const hashParams = new URLSearchParams(request.url.split('#')[1]);
    const accessToken = hashParams.get('access_token');
    const tokenType = hashParams.get('token_type');
    
    if (accessToken && tokenType) {
      // If we have an access token, we can use it directly
      const supabase = createRouteHandlerClient<Database>({ cookies });
      const { data: { session }, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get('refresh_token') || '',
        token_type: tokenType,
      });
      
      if (sessionError || !session) {
        console.error('Error setting session from hash:', sessionError);
        return redirectTo('/login?error=auth_error&error_description=Failed to authenticate with provider');
      }
      
      return redirectTo('/dashboard');
    }
  }

  // Validate required parameters
  if (!code) {
    logEvent('Missing authorization code', { requestUrl: requestUrl.toString() });
    return createErrorResponse({
      error: 'missing_code',
      error_description: 'No authorization code provided',
      state,
    }, baseUrl);
  }

  try {
    logEvent('Starting code exchange flow');
    
    // Create a Supabase client configured to use cookies
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Exchange the authorization code for a session
    logEvent('Exchanging authorization code for session');
    const { data: { session: authSession }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError || !authSession) {
      logEvent('Error exchanging code for session', { 
        error: authError,
        hasSession: !!authSession,
      });
      throw authError || new Error('No session returned after code exchange');
    }
    
    logEvent('Successfully exchanged code for session', {
      userId: authSession.user?.id,
      email: authSession.user?.email,
    });

    // Get the user's session
    logEvent('Retrieving user session');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      logEvent('Failed to get session after auth', { error: sessionError });
      throw sessionError || new Error('No session after authentication');
    }

    logEvent('User authenticated successfully', {
      userId: session.user?.id,
      email: session.user?.email,
      provider: session.user?.app_metadata?.provider,
    });

    // Get or create the user profile
    logEvent('Fetching user profile');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      logEvent('Creating new user profile', { userId: session.user.id });
      
      const { error: createProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url,
          updated_at: new Date().toISOString(),
        });

      if (createProfileError) {
        logEvent('Error creating user profile', { error: createProfileError });
        throw createProfileError;
      }
      
      logEvent('Successfully created user profile', { userId: session.user.id });
    } else {
      logEvent('Found existing user profile', { 
        userId: profile.id,
        name: profile.full_name,
      });
    }

    // Create a redirect response
    const redirectUrl = new URL(state && state !== '/' ? state : '/dashboard', baseUrl);
    
    // Set secure cookies with SameSite and HttpOnly flags
    const response = NextResponse.redirect(redirectUrl);
    
    // Set session cookies (Supabase should handle this automatically, but we'll ensure it)
    if (session) {
      response.cookies.set('sb-access-token', session.access_token, {
        ...SESSION_COOKIE_OPTIONS,
        maxAge: session.expires_in || SESSION_COOKIE_OPTIONS.maxAge,
      });
      
      if (session.refresh_token) {
        response.cookies.set('sb-refresh-token', session.refresh_token, {
          ...SESSION_COOKIE_OPTIONS,
          maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
        });
      }
    }
    
    logEvent('Authentication successful', {
      userId: session.user?.id,
      redirectTo: redirectUrl.toString(),
    });
    
    return response;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    logEvent('Authentication error', { 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return createErrorResponse({
      error: 'authentication_error',
      error_description: errorMessage,
      state,
    }, baseUrl);
  }
}
