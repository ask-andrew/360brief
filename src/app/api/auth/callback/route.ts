import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In Auth0 v4.8.0, the SDK automatically handles the OAuth callback
    // We just need to redirect to the dashboard after successful authentication
    const redirectUrl = new URL('/dashboard', process.env.AUTH0_BASE_URL || 'http://localhost:3000');
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Auth callback error:', error);
    
    // Redirect to login with error details
    const loginUrl = new URL('/login', process.env.AUTH0_BASE_URL || 'http://localhost:3000');
    loginUrl.searchParams.set('error', 'auth_failed');
    
    if (error instanceof Error) {
      loginUrl.searchParams.set('error_description', encodeURIComponent(error.message));
    }
    
    return NextResponse.redirect(loginUrl);
  }
}
