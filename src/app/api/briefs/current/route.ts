import { NextResponse } from 'next/server';
import { generateBrief } from '@/server/briefs/generateBrief';
import { fetchUnifiedData } from '@/lib/services/unifiedDataService';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Resolve authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unified = await fetchUnifiedData(user.id, { startDate: startDate ?? undefined, endDate: endDate ?? undefined });
    const data = generateBrief(unified);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to build brief' }, { status: 500 });
  }
}
