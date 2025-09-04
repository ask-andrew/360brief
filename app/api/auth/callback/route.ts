import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', { error, description: errorDescription });
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  // Verify we have an authorization code
  if (!code) {
    console.error('No code provided in callback');
    return NextResponse.redirect(
      new URL('/login?error=NoCode', requestUrl.origin)
    );
  }

  try {
    const supabase = await createClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('Error exchanging code for session:', sessionError);
      throw sessionError;
    }

    // Ensure user profile exists
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          email: user.email || '', 
          // Add any other default profile fields here
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating/updating profile:', profileError);
      }
    }

    // Redirect to the dashboard after successful sign in
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    
  } catch (err) {
    console.error('Error in auth callback:', err);
    return NextResponse.redirect(
      new URL('/login?error=AuthError', requestUrl.origin)
    );
  }
}
