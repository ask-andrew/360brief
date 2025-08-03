import { NextResponse } from 'next/server';
import { getTokensFromCode, saveTokens, getUserProfile } from '@/lib/google/oauth';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(
        'Authorization failed. Please try again.'
      )}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(
        'No authorization code provided.'
      )}`
    );
  }

  try {
    // Exchange the authorization code for tokens
    const tokens = await getTokensFromCode(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to retrieve access and refresh tokens');
    }

    // Get the user's profile information
    const profile = await getUserProfile(tokens.access_token);
    
    if (!profile.email) {
      throw new Error('Failed to retrieve user email from Google');
    }

    // Get or create the user in your database
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', profile.email)
      .single();

    let userId: string;

    if (userError || !userData) {
      // Create a new user if they don't exist
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: profile.email,
        email_confirm: true,
        user_metadata: {
          full_name: profile.name,
          avatar_url: profile.picture,
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

    // Save the tokens to the database
    await saveTokens(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000, // Default to 1 hour if not provided
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope || '',
    });

    // Set a session cookie
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      userId,
      authenticationMethod: 'oauth',
      authenticationMethodReference: 'google',
    });

    if (sessionError || !sessionData.session) {
      console.error('Error creating session:', sessionError);
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

    // Redirect to the dashboard or the original URL
    const redirectUrl = state ? decodeURIComponent(state) : '/dashboard';
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${redirectUrl}`);

  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(
        'Authentication failed. Please try again.'
      )}`
    );
  }
}
