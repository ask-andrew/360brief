import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set the cookie in the request
          request.cookies.set({
            name,
            value,
            ...options,
          });
          
          // Update the response with the new cookie
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          // Set the cookie in the response
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Remove the cookie from the request
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          
          // Update the response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          // Remove the cookie from the response
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/', // Home page
    '/login', 
    '/signin',
    '/signup',
    '/register', 
    '/forgot-password', 
    '/reset-password',
    '/dev/login', // Dev login route
    '/api/auth/callback',
    '/_next/static',
    '/_next/image',
    '/favicon.ico',
  ];
  
  // Check for dev session in development
  const isDevMode = process.env.NODE_ENV === 'development';
  const devSessionCookie = request.cookies.get('devSession');
  const hasDevSession = isDevMode && devSessionCookie?.value === 'true';

  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Handle OAuth callback - allow it to complete without redirects
  if (request.nextUrl.pathname.startsWith('/api/auth/callback')) {
    return response;
  }

  // If user is not signed in and the current route is not public, redirect to login
  if (!user && !isPublicRoute && !hasDevSession) {
    const redirectUrl = new URL(isDevMode ? '/dev/login' : '/login', request.url);
    // Only set redirectedFrom if we're not already on a login page
    if (!request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/dev/login')) {
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and tries to access auth routes, redirect to dashboard
  if (user && isPublicRoute && !request.nextUrl.pathname.startsWith('/api/')) {
    // Check if there's a redirect URL in the query params
    const redirectTo = request.nextUrl.searchParams.get('redirectedFrom') || '/dashboard';
    // Ensure we don't redirect back to the same URL to prevent loops
    if (redirectTo !== request.nextUrl.pathname) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (image files)
     * - api/auth/callback (auth callbacks)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|api/auth/callback).*)',
  ],
};
