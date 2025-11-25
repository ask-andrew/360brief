import { NextResponse } from 'next/server';
import { analyzeCommunicationPatterns } from '@/services/analytics/communicationPatterns';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const weeksParam = searchParams.get('weeks');
    const weeks = weeksParam ? Math.max(1, Math.min(4, parseInt(weeksParam, 10) || 2)) : 2;

    const patterns = await analyzeCommunicationPatterns(session.user.id, {
      weeks,
      userEmail: session.user.email || undefined,
    });
    
    return NextResponse.json(patterns);
  } catch (error: any) {
    console.error('Error fetching communication patterns:', error);
    const message = typeof error?.message === 'string' ? error.message : 'Failed to analyze communication patterns';
    const status = message.includes('Gmail not connected') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
