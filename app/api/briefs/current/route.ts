import { NextResponse } from 'next/server';
import { generateBrief } from '@/server/briefs/generateBrief';
import { fetchUnifiedData } from '@/services/unifiedDataService';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // Resolve authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(' Brief GET start', { userId: user.id, startDate, endDate });

    const unified = await fetchUnifiedData(user.id, { 
      startDate: startDate ?? undefined, 
      endDate: endDate ?? undefined,
      useCase: 'brief' 
    });

    // Debug: summarize what we fetched
    const counts = {
      emails: Array.isArray((unified as any)?.emails) ? (unified as any).emails.length : 0,
      incidents: Array.isArray((unified as any)?.incidents) ? (unified as any).incidents.length : 0,
      calendarEvents: Array.isArray((unified as any)?.calendarEvents) ? (unified as any).calendarEvents.length : 0,
      tickets: Array.isArray((unified as any)?.tickets) ? (unified as any).tickets.length : 0,
    };
    console.log(' Unified data fetched for brief', counts);

    const data = await generateBrief(unified);
    console.log(' Brief generated', { generatedAt: (data as any)?.generated_at, timeRange: (data as any)?.time_range });

    return NextResponse.json(data);
  } catch (e: any) {
    console.error(' Brief GET failed', { message: e?.message, stack: e?.stack });
    return NextResponse.json({ error: e?.message ?? 'Failed to build brief' }, { status: 500 });
  }
}
