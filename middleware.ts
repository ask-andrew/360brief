import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  const { data: { session } } = await supabase.auth.getSession();
  const url = request.nextUrl.pathname;

  // Redirect to login if trying to access protected routes without a session
  if ((url.startsWith('/dashboard') || url.startsWith('/account')) && !session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if logged in and trying to access auth pages
  if ((url === '/login' || url === '/signup') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/login', '/signup'],
};
