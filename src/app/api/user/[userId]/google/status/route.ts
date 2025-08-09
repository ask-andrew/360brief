import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.id !== params.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('user_tokens')
    .select('id')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .maybeSingle();

  if (error) {
    console.error('Error checking Google status:', error);
    return NextResponse.json({ error: 'Failed to check Google connection status' }, { status: 500 });
  }

  return NextResponse.json({ isConnected: Boolean(data) });
}
