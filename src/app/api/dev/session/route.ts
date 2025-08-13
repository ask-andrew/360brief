import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  // Initialize Supabase admin client with service role key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
  
  // Get the cookie store for setting cookies
  const cookieStore = cookies();

  try {
    // Sign in as the development user using email/password
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: 'dev@example.com',
      password: 'password', // This should be set in your Supabase auth settings
    });

    if (error) {
      console.error('Error signing in dev user:', error);
      throw error;
    }

    if (!data.session) {
      throw new Error('No session returned after sign in');
    }

    // Return the session data
    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: 'bearer',
    });
  } catch (error) {
    console.error('Error creating dev session:', error);
    return NextResponse.json(
      { error: 'Failed to create development session' },
      { status: 500 }
    );
  }
}
