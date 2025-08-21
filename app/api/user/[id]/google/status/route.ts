import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseServerClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Prefer Authorization: Bearer <jwt> and avoid cookies() entirely in this route
    const authz = req.headers.get('authorization') || req.headers.get('Authorization');
    const match = authz?.match(/^Bearer\s+(.+)$/i);
    const jwt = match?.[1];
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!jwt || !url || !serviceKey) {
      return NextResponse.json({ error: 'Unauthorized: Auth session missing' }, { status: 401 });
    }

    const admin = createSupabaseServerClient(url, serviceKey);
    const { data: authData, error: authErr } = await admin.auth.getUser(jwt);
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    const user = authData.user as any;

    // Derive userId directly from the request URL to avoid strict context typing issues in some build environments
    const { pathname } = new URL(req.url);
    const segments = pathname.split('/').filter(Boolean);
    // Expecting: ["api","user","<id>","google","status"]
    const userIndex = segments.indexOf('user');
    const userId = userIndex >= 0 && segments.length > userIndex + 1 ? segments[userIndex + 1] : '';
    // Only allow a user to query their own status
    if (user.id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data, error } = await admin
      .from('user_connected_accounts')
      .select('id, provider, provider_account_id, email, account_type, scopes, access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'google');

    if (error) throw error;

    const now = Date.now();
    type Row = {
      id: string;
      email: string | null;
      account_type: string | null;
      scopes: string[] | null;
      access_token: string | null;
      refresh_token: string | null;
      expires_at: string | null;
    };
    const accounts = (data || []).map((row: Row) => {
      const exp = row.expires_at ? new Date(row.expires_at).getTime() : 0;
      const isValid = !!row.access_token && (!!exp ? exp - now > 60_000 : true);
      return {
        id: row.id,
        email: row.email,
        account_type: row.account_type,
        scopes: row.scopes,
        has_refresh_token: !!row.refresh_token,
        expires_at: row.expires_at,
        is_valid: isValid,
      };
    });

    const isConnected = accounts.length > 0;
    return NextResponse.json({ isConnected, accounts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to get Google status' }, { status: 500 });
  }
}
