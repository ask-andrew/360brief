import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: any) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = context?.params?.id as string;
    // Only allow a user to query their own status
    if (user.id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data, error } = await supabase
      .from('user_connected_accounts')
      .select('id, provider, provider_account_id, email, account_type, scopes, access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'google');

    if (error) throw error;

    const now = Date.now();
    const accounts = (data || []).map((row) => {
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
