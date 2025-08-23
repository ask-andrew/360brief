import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// List of public paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/pricing',
  '/why-i-built-this',
  '/_next/static',
  '/_next/image',
  '/favicon.ico'
];

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/briefs',
  '/analytics',
  '/preferences',
  '/account'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  
  // Skip middleware for public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set the cookie in the response
          response.cookies.set({
            name,
            value,
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        },
        remove(name: string, options: CookieOptions) {
          // Remove the cookie in the response
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  // Check if the user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  // Handle auth callback - let it through
  if (pathname.startsWith('/auth/callback')) {
    return response;
  }

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // If user is not signed in and trying to access a protected path
  if (!session && isProtectedPath) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and trying to access a public auth page
  if (session && (pathname === '/login' || pathname === '/signup')) {
    const redirectTo = request.nextUrl.searchParams.get('redirectedFrom') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth endpoints)
     * - _next (Next.js internals)
     * - fonts (font files)
     * - images (image files)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpeg|jpg|svg|gif|webp|woff2?)$|api/auth).*)',
  ],
};
