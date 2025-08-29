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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      throw error;
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
