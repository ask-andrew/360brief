import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const provider = requestUrl.searchParams.get('provider') as 'google' | 'github' | undefined;
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/';

  if (!provider) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=No provider specified`,
      { status: 400 }
    );
  }

  const supabase = await createClient();
  
  // Generate the OAuth URL with the redirectTo parameter
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${requestUrl.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`,
      { status: 400 }
    );
  }

  // Redirect to the OAuth provider's consent page
  return NextResponse.redirect(data.url, { status: 302 });
}

export const dynamic = 'force-dynamic';
