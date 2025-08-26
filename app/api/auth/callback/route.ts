import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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
    console.error('No code provided in OAuth callback');
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // Exchange the code for a session
    const { error: authError, data } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !data?.session) {
      console.error('Failed to exchange code for session:', authError);
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', requestUrl.origin)
      );
    }

    // Success! Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  } catch (err) {
    console.error('Error in OAuth callback:', err);
    return NextResponse.redirect(
      new URL('/login?error=server_error', requestUrl.origin)
    );
  }
}
