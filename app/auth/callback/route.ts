import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectPath = requestUrl.searchParams.get('redirect') || '/dashboard';
  
  console.log('Auth callback triggered with code:', code ? 'present' : 'missing');
  
  try {
    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        throw error;
      }
      console.log('Successfully exchanged code for session');
    } else {
      console.warn('No code parameter found in callback URL');
    }

    // Decode the redirect path and validate it to prevent open redirects
    const decodedRedirectPath = decodeURIComponent(redirectPath);
    const redirectUrl = new URL(decodedRedirectPath, request.url);
    
    // Ensure we're only redirecting to same-origin URLs
    if (redirectUrl.origin !== new URL(request.url).origin) {
      console.error('Invalid redirect URL detected:', redirectUrl.toString());
      throw new Error('Invalid redirect URL');
    }
    
    console.log('Redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in auth callback:', error);
    // Include error details in the redirect
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'authentication_failed');
    
    // Add error details for debugging (not shown to user by default)
    if (error instanceof Error) {
      loginUrl.searchParams.set('error_details', encodeURIComponent(error.message));
    }
    
    console.log('Redirecting to login with error');
    return NextResponse.redirect(loginUrl);
  }
}
