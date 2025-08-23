import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Forward to client-side callback to perform PKCE code exchange in the browser
  const url = new URL(request.url);
  const forward = new URL('/auth/cb', url.origin);
  url.searchParams.forEach((v, k) => forward.searchParams.set(k, v));
  if (process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true' || process.env.NEXT_PUBLIC_DEBUG_AUTH === '1') {
    // eslint-disable-next-line no-console
    console.log('[AUTHDBG][server] forwarding OAuth callback', {
      incoming: url.toString(),
      forward: forward.toString(),
      params: Object.fromEntries(url.searchParams.entries()),
    });
  }
  return NextResponse.redirect(forward);
}
