import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface SenderEngagementMetric {
  id: string;
  sender_email: string;
  sender_name: string | null;
  client_name: string | null;
  total_received: number;
  total_opened: number;
  total_replied: number;
  open_rate: number;
  reply_rate: number;
  last_interaction: string | null;
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch sender engagement metrics for the current user
    const { data: metrics, error } = await supabase
      .from('sender_engagement_metrics')
      .select(`
        id,
        sender_email,
        sender_name,
        client_name,
        total_received,
        total_opened,
        total_replied,
        last_interaction
      `)
      .eq('user_id', session.user.id)
      .order('last_interaction', { ascending: false });

    if (error) {
      console.error('Error fetching sender metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sender metrics' },
        { status: 500 }
      );
    }

    // Calculate rates and format the response
    const formattedMetrics: SenderEngagementMetric[] = (metrics || []).map(metric => ({
      ...metric,
      open_rate: metric.total_received > 0 
        ? Math.round((metric.total_opened / metric.total_received) * 100) / 100 
        : 0,
      reply_rate: metric.total_received > 0 
        ? Math.round((metric.total_replied / metric.total_received) * 100) / 100 
        : 0,
    }));

    return NextResponse.json({ data: formattedMetrics });
    
  } catch (error) {
    console.error('Unexpected error in sender metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
