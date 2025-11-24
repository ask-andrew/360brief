import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGmailAccessToken, fetchGmailMessages, analyzeGmailData } from '@/lib/gmail-api';

export async function GET(request: Request) {
  const startTime = Date.now();
  
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
    const useRealData = searchParams.get('use_real_data') === 'true';
    const maxMessages = Math.min(parseInt(searchParams.get('max') || '50'), 100);
    
    console.log(`⚡ Quick analytics request for user ${session.user.id}, useRealData: ${useRealData}`);

    // If not using real data, return demo quickly
    if (!useRealData) {
      const demoData = {
        status: 'demo',
        dataSource: 'demo',
        total_count: 1247,
        inbound_count: 843,
        outbound_count: 404,
        avg_response_time_minutes: 127,
        missed_messages: 4,
        focus_ratio: 68,
        external_percentage: 35,
        internal_percentage: 65,
        top_projects: [
          { name: 'Project Alpha', messageCount: 75 },
          { name: 'Q2 Budget', messageCount: 45 },
          { name: 'Client Onboarding', messageCount: 32 }
        ],
        reconnect_contacts: [
          { name: 'Alex Johnson', role: 'Product Manager', days: 42, email: 'alex@example.com' },
          { name: 'Jordan Smith', role: 'Engineering Lead', days: 37, email: 'jordan@example.com' }
        ],
        recent_trends: {
          messages: { change: 12, direction: 'up' as const },
          response_time: { change: -8, direction: 'down' as const },
          meetings: { change: 23, direction: 'up' as const }
        },
        sentiment_analysis: {
          positive: 68,
          neutral: 24,
          negative: 8,
          overall_trend: 'positive' as const
        },
        priority_messages: {
          awaiting_my_reply: [
            {
              id: '1',
              sender: 'Sarah Chen',
              subject: 'Q4 Budget Approval Needed',
              channel: 'email',
              timestamp: '2 hours ago',
              priority: 'high' as const,
              link: '/messages/1'
            }
          ],
          awaiting_their_reply: []
        },
        channel_analytics: {
          by_channel: [
            { name: 'Email', count: 524, percentage: 42 },
            { name: 'Slack', count: 398, percentage: 32 },
            { name: 'Teams', count: 203, percentage: 16 }
          ],
          by_time: [
            { hour: '9AM', count: 89 },
            { hour: '10AM', count: 124 },
            { hour: '11AM', count: 156 }
          ]
        },
        fetchedAt: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`
      };

      console.log(`⚡ Demo analytics returned in ${Date.now() - startTime}ms`);
      return NextResponse.json(demoData);
    }

    // Try to get real data quickly
    try {
      const accessToken = await getGmailAccessToken(session.user.id);
      
      if (!accessToken) {
        return NextResponse.json({
          status: 'error',
          error: 'Gmail not connected',
          message: 'Please connect your Gmail account to see real analytics',
          dataSource: 'none'
        }, { status: 400 });
      }

      // Fetch limited messages for speed
      const messages = await fetchGmailMessages(accessToken, maxMessages);
      
      if (!messages || messages.length === 0) {
        return NextResponse.json({
          status: 'no_data',
          error: 'No messages found',
          message: 'No recent messages found in your Gmail account',
          dataSource: 'gmail',
          total_count: 0
        }, { status: 200 });
      }

      // Analyze the data
      const analytics = analyzeGmailData(messages, session.user.email || '');
      
      const response = {
        status: 'success',
        ...analytics,
        dataSource: 'gmail',
        totalCount: analytics.total_count,
        fetchedAt: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`,
        messageCount: messages.length
      };

      console.log(`⚡ Real analytics processed in ${Date.now() - startTime}ms with ${messages.length} messages`);
      
      return NextResponse.json(response);
      
    } catch (gmailError: any) {
      console.error('Gmail fetch error:', gmailError);
      
      // Return a graceful fallback instead of failing
      return NextResponse.json({
        status: 'partial',
        error: 'Gmail fetch failed',
        message: gmailError.message || 'Failed to fetch Gmail data',
        dataSource: 'error',
        total_count: 0,
        fetchedAt: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`
      }, { status: 200 }); // Return 200 so UI can handle gracefully
    }

  } catch (error: any) {
    console.error('Quick analytics error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message || 'Failed to generate analytics',
        processingTime: `${Date.now() - startTime}ms`
      },
      { status: 500 }
    );
  }
}
