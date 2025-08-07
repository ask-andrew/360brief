import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  // This is a development-only endpoint
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  const cookieStore = cookies();
  const supabase = createServerSupabaseClient();

  try {
    // Define test user credentials with a fixed email for development
    const testEmail = 'test@360brief.app';
    const testPassword = 'testpassword123';
    
    // First try to sign up (which will also sign in the user)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          avatar_url: ''
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      }
    });

    if (signUpError) {
      console.error('Error signing up test user:', signUpError);
      
      // If user already exists, try to sign in
      if (signUpError.message.includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

        if (signInError) {
          console.error('Error signing in test user:', signInError);
          throw signInError;
        }

        return NextResponse.json({
          success: true,
          message: 'Logged in as test user',
          user: signInData.user,
        });
      }
      
      throw signUpError;
    }

    // If we get here, sign up was successful
    return NextResponse.json({
      success: true,
      message: 'Test user created and logged in',
      user: signUpData.user,
    });
  } catch (error: any) {
    console.error('Error in dev login:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An error occurred during login',
        details: error
      },
      { status: 500 }
    );
  }
}
