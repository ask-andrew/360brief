import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/settings'];

// Define public routes that should not be accessible when logged in
const publicRoutes = ['/login', '/signup', '/'];

// List of Auth0-related paths that should bypass the middleware
const authPaths = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/callback',
  '/api/auth/me'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for Auth0-related paths and static files
  if (
    authPaths.some(path => pathname.startsWith(path)) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
  }
  
  // Log all cookies for debugging
  const allCookies = request.cookies.getAll().map(c => c.name);
  console.log('All cookies in request:', allCookies);
  
  // Check for Auth0 session cookies
  const auth0Cookies = {
    appSession: request.cookies.get('appSession'),
    auth0IsAuthenticated: request.cookies.get('auth0.is.authenticated'),
    auth0State: request.cookies.get('auth0:state'),
    a0State: request.cookies.get('a0:state'),
    a0Session: request.cookies.get('a0:session')
  };
  
  console.log('Auth0 session cookies:', JSON.stringify(auth0Cookies, null, 2));
  
  const hasAuth0Session = Object.values(auth0Cookies).some(cookie => cookie !== undefined);
  console.log('Has Auth0 session:', hasAuth0Session);
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Check if the current route is public and should not be accessible when logged in
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  
  // If the user is not authenticated and trying to access a protected route
  if (isProtectedRoute && !hasAuth0Session) {
    console.log('Redirecting to login from protected route:', pathname);
    const loginUrl = new URL('/api/auth/login', request.url);
    // Auth0 uses 'returnTo' parameter for post-login redirect
    loginUrl.searchParams.set('returnTo', pathname);
    console.log('Login URL with returnTo:', loginUrl.toString());
    return NextResponse.redirect(loginUrl);
  }
  
  // If the user is authenticated and trying to access a public route
  if (isPublicRoute && hasAuth0Session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Continue with the request if no redirection is needed
  return NextResponse.next();
  
  return NextResponse.next();
}

// Configure which routes should be processed by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
