import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectPath = requestUrl.searchParams.get('redirect') || '/dashboard';
  
  try {
    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      await supabase.auth.exchangeCodeForSession(code);
    }

    // Decode the redirect path and validate it to prevent open redirects
    const decodedRedirectPath = decodeURIComponent(redirectPath);
    const redirectUrl = new URL(decodedRedirectPath, request.url);
    
    // Ensure we're only redirecting to same-origin URLs
    if (redirectUrl.origin !== new URL(request.url).origin) {
      throw new Error('Invalid redirect URL');
    }
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in auth callback:', error);
    // Redirect to login with error message on failure
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'authentication_failed');
    return NextResponse.redirect(loginUrl);
  }
}
