import { NextResponse } from 'next/server';
import { generateAuthUrl } from '@/server/google/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized: please sign in before connecting Google.' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const redirectPath = searchParams.get('redirect') || '/dashboard';

    const url = generateAuthUrl(redirectPath);
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to initiate Google OAuth' }, { status: 500 });
  }
}
