import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Delete a connected account by id (scoped to current user via RLS)
export async function DELETE(_req: Request, context: any) {
  try {
    const { params } = context || { params: {} } as any;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('user_connected_accounts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete connected account' }, { status: 500 });
  }
}

// Update account_type for a connected account (personal|business)
export async function PATCH(req: Request, context: any) {
  try {
    const { params } = context || { params: {} } as any;
    const body = await req.json().catch(() => ({}));
    const account_type = body?.account_type;
    if (account_type !== 'personal' && account_type !== 'business') {
      return NextResponse.json({ error: 'Invalid account_type' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('user_connected_accounts')
      .update({ account_type })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('id, email, account_type')
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ account: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update connected account' }, { status: 500 });
  }
}
