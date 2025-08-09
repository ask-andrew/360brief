import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens } from '@/server/google/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/login?error=missing_code`);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/login?error=unauthorized`);
    }

    const tokens = await exchangeCodeForTokens(code);

    // Persist tokens (server-side, RLS protects by user_id)
    // Normalize scope to a space-delimited string or null
    const scopeStr = Array.isArray((tokens as any).scope)
      ? ((tokens as any).scope as string[]).join(' ')
      : (tokens as any).scope ?? null;

    await supabase
      .from('user_tokens')
      .upsert({
        user_id: user.id,
        provider: 'google',
        access_token: tokens.access_token ?? null,
        // Keep existing refresh_token if Google didn't return a new one
        refresh_token: tokens.refresh_token ?? undefined,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        token_type: tokens.token_type ?? null,
        scope: scopeStr,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' });

    // Redirect back to original path
    const redirectTo = state.startsWith('/') ? state : '/dashboard';
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}${redirectTo}`);
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message || 'oauth_failed');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/login?error=${msg}`);
  }
}
