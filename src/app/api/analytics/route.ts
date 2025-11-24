import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeGmailData } from '@/lib/gmail-api';
import { getGmailAccessToken, fetchGmailMessages } from '@/lib/gmail-api';

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
    const daysBack = searchParams.get('daysBack') || '7';
    const maxMessages = Math.min(parseInt(searchParams.get('max') || '200'), 500);
    
    console.log(`📊 Analytics request for user ${session.user.id}, days: ${daysBack}, maxMessages: ${maxMessages}`);

    // Get Gmail access token
    const accessToken = await getGmailAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Gmail not connected',
          message: 'Please connect your Gmail account to see real analytics',
          dataSource: 'none'
        },
        { status: 400 }
      );
    }

    // Fetch Gmail messages with optimized batch processing
    console.log(`📧 Fetching up to ${maxMessages} Gmail messages...`);
    const messages = await fetchGmailMessages(accessToken, maxMessages);
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({
        error: 'No messages found',
        message: 'No recent messages found in your Gmail account',
        dataSource: 'gmail',
        total_count: 0,
        processingTime: `${Date.now() - startTime}ms`
      }, { status: 200 });
    }

    console.log(`📧 Processing ${messages.length} messages for analytics...`);
    
    // Analyze the data with batch processing
    const analytics = analyzeGmailData(messages, session.user.email || '');
    
    // Add comprehensive metadata
    const response = {
      ...analytics,
      dataSource: 'gmail',
      totalCount: analytics.total_count,
      fetchedAt: new Date().toISOString(),
      daysBack: parseInt(daysBack),
      processingTime: `${Date.now() - startTime}ms`,
      messageCount: messages.length,
      userId: session.user.id,
      // Add batch processing metadata
      batchInfo: {
        processedMessages: messages.length,
        maxMessagesAllowed: maxMessages,
        timeRange: `${daysBack} days`,
        processingSpeed: `${Math.round(messages.length / ((Date.now() - startTime) / 1000))} messages/second`
      }
    };

    console.log(`✅ Analytics generated in ${Date.now() - startTime}ms: ${analytics.total_count} messages processed`);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Analytics generation error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate analytics',
        processingTime: `${Date.now() - startTime}ms`,
        dataSource: 'error'
      },
      { status: 500 }
    );
  }
}
