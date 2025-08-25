import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens, getOAuthClient } from '@/server/google/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const rawState = url.searchParams.get('state') || '';

  // Default redirect + account type
  let redirectPath = '/dashboard';
  let accountType: 'personal' | 'business' = 'personal';
  if (rawState) {
    try {
      const decoded = decodeURIComponent(rawState);
      const obj = JSON.parse(Buffer.from(decoded, 'base64').toString('utf-8')) as any;
      if (obj?.redirect && typeof obj.redirect === 'string') redirectPath = obj.redirect;
      if (obj?.account_type === 'personal' || obj?.account_type === 'business') accountType = obj.account_type;
    } catch {
      // If state isn't structured, treat as simple path if it starts with '/'
      if (rawState.startsWith('/')) redirectPath = rawState;
    }
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/login?error=missing_code`);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/login?error=unauthorized`);
    }

    const tokens = await exchangeCodeForTokens(code);

    // Verify ID token to get Google identity
    const idToken = (tokens as any).id_token as string | undefined;
    if (!idToken) throw new Error('Missing Google ID token');
    const oauth = getOAuthClient();
    const ticket = await oauth.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const providerAccountId = payload?.sub;
    if (!email || !providerAccountId) throw new Error('Unable to resolve Google identity');

    // Upsert into multi-account table
    const scopesArr = (typeof (tokens as any).scope === 'string')
      ? ((tokens as any).scope as string).split(' ').filter(Boolean)
      : Array.isArray((tokens as any).scope) ? (tokens as any).scope as string[] : [];

    const { error } = await supabase
      .from('user_connected_accounts')
      .upsert({
        user_id: user.id,
        provider: 'google',
        provider_account_id: providerAccountId,
        email,
        account_type: accountType,
        scopes: scopesArr,
        access_token: (tokens as any).access_token ?? null,
        refresh_token: (tokens as any).refresh_token ?? null,
        expires_at: (tokens as any).expiry_date ? new Date((tokens as any).expiry_date).toISOString() : null,
        token_type: (tokens as any).token_type ?? null,
      }, { onConflict: 'user_id,provider,provider_account_id' });
    if (error) throw error;

    // Redirect back to original path
    const redirectTo = redirectPath.startsWith('/') ? redirectPath : '/dashboard';
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}${redirectTo}`);
  } catch (e: any) {
    const msg = encodeURIComponent(e?.message || 'oauth_failed');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || ''}/login?error=${msg}`);
  }
}
