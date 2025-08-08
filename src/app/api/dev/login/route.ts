import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/custom-client';

// This is a development-only endpoint
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  const testEmail = 'dev@360brief.local';
  const testPassword = 'devpassword123';

  try {
    console.log('Attempting dev login with email:', testEmail);
    
    // Sign in with password (will create user if doesn't exist)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      // If user doesn't exist, sign up first
      console.log('User does not exist, creating new user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Development User',
            avatar_url: ''
          }
        }
      });

      if (signUpError) {
        console.error('Error creating user:', signUpError);
        throw signUpError;
      }

      // Sign in with the new user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        console.error('Error signing in after sign up:', signInError);
        throw signInError;
      }

      return NextResponse.json({
        success: true,
        message: 'Created and logged in as dev user',
        user: signInData.user,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Logged in as dev user',
      user: data.user,
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
