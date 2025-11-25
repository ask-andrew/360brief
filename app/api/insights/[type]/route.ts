import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/insights/[type]?userId=...
 * Returns the latest insight of the given type for the specified user.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = new URL(request.url);
  const type = url.pathname.split('/').pop(); // last segment
  const userId = searchParams.get('userId');

  if (!type || !userId) {
    return NextResponse.json({ error: 'Missing type or userId' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('analytics_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('insight_type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching insight:', error);
    return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
