import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('user_connected_accounts')
      .select('id, provider, provider_account_id, email, account_type, scopes, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ accounts: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to list connected accounts' }, { status: 500 });
  }
}
