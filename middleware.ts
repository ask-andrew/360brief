import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/signin', 
  '/auth/callback', 
  '/_next', 
  '/favicon.ico',
  '/api/auth',
  '/_vercel/insights/script.js',
  '/_vercel/insights/script.js.map',
  '/_vercel/insights/script.out.js',
  '/_vercel/insights/script.out.js.map'
];

// Configure which paths the middleware will run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|css|js|jsx|ts|tsx)$).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    // Create a response object we can modify
    const response = NextResponse.next();
    
    // Create a Supabase client with the request and response
    const supabase = createMiddlewareClient({ 
      req: request, 
      res: response 
    });
    
    // Refresh the session if expired
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // If there's an error or no session, redirect to signin
    if (error || !session) {
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Add headers for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      response.headers.set('Pragma', 'no-cache');
    }
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of error, redirect to signin
    const redirectUrl = new URL('/signin', request.url);
    return NextResponse.redirect(redirectUrl);
  }
}
