import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';
import env from '@/config/env';

export async function GET(request: Request) {
  const { searchParams, hash } = new URL(request.url);
  let code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');
  
  // If we have a hash fragment, parse it for the access token
  if (!code && request.url.includes('#')) {
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

  // Redirect base URL
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectTo = (path: string) => {
    const url = new URL(path, baseUrl);
    return NextResponse.redirect(url);
  };

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', { error, errorDescription, state });
    return redirectTo(
      `/login?error=${encodeURIComponent(error)}${
        errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ''
      }`
    );
  }

  if (!code) {
    console.error('No authorization code provided in callback');
    return redirectTo(
      '/login?error=missing_code&error_description=No authorization code provided'
    );
  }

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Exchange the authorization code for a session
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      console.error('Error exchanging code for session:', authError);
      throw authError;
    }

    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Failed to get session after auth:', sessionError);
      throw sessionError || new Error('No session after authentication');
    }

    console.log('User authenticated successfully:', session.user?.email);
    
    // The session is automatically stored in cookies by createRouteHandlerClient
    // No need to manually set cookies as Supabase handles it

    // Get or create the user in your database
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user?.email)
      .single();

    let userId: string;

    if (userError || !userData) {
      // Create a new user if they don't exist
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: session.user?.email,
        email_confirm: true,
        user_metadata: {
          full_name: session.user?.user_metadata?.full_name,
          avatar_url: session.user?.user_metadata?.avatar_url,
        },
      });

      if (createUserError || !newUser) {
        console.error('Error creating user:', createUserError);
        throw new Error('Failed to create user account');
      }

      userId = newUser.user.id;
    } else {
      userId = userData.id;
    }

    const { data: sessionData, error: sessionCreationError } = await supabase.auth.admin.createSession({
      userId,
      authenticationMethod: 'oauth',
      authenticationMethodReference: 'google',
    });

    if (sessionCreationError || !sessionData?.session) {
      console.error('Error creating session:', sessionCreationError);
      throw new Error('Failed to create user session');
    }

    // Set the session cookie
    cookies().set('sb-access-token', sessionData.session.access_token, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });

    cookies().set('sb-refresh-token', sessionData.session.refresh_token, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });

    // Redirect to the dashboard or the original URL from state
    const redirectUrl = state && state !== '/' ? state : '/dashboard';
    return redirectTo(redirectUrl);
    
  } catch (error) {
    console.error('Auth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return redirectTo(
      `/login?error=auth_failed&error_description=${encodeURIComponent(errorMessage)}`
    );
  }
}
