import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMessageCacheService } from '@/services/analytics/messageCacheService';
import { analyzeGmailData } from '@/lib/gmail-api';
import { createClient as createSbClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    let { data: { session } } = await supabase.auth.getSession();

    // Fallback: support Bearer token auth for client-side Supabase sessions
    if (!session) {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7)
        : '';
      if (token) {
        const admin = createSbClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: userData } = await admin.auth.getUser(token);
        if (userData?.user) {
          session = {
            user: {
              id: userData.user.id,
              email: userData.user.email || undefined,
            } as any,
          } as any;
        }
      }
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('daysBack') || '7');
    
    console.log(`📊 Analytics from job request for user ${session.user.id}, days: ${daysBack}`);

    // Get the message cache service
    const cacheService = getMessageCacheService();
    
    // Calculate the since date for the cache query
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);
    
    // Get cached messages for the user
    const messages = await cacheService.getMessages(session.user.id, {
      limit: 1000,
      since: sinceDate
    });

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        error: 'No cached messages found',
        message: 'No messages found in cache. Please run a job first.',
        dataSource: 'cache',
        total_count: 0,
        processingTime: `${Date.now() - startTime}ms`
      }, { status: 200 });
    }

    console.log(`📧 Processing ${messages.length} cached messages for analytics...`);
    
    // Convert cached messages to GmailMessage format
    const gmailMessages = messages.map(msg => ({
      id: msg.message_id,
      threadId: msg.thread_id || `thread-${msg.message_id}`,
      labelIds: ['INBOX'],
      snippet: msg.subject || 'No subject',
      payload: {
        headers: [
          { name: 'Subject', value: msg.subject || 'No subject' },
          { name: 'From', value: msg.from_email || 'Unknown' },
          { name: 'To', value: (msg.to_emails || []).join(', ') },
          { name: 'Date', value: msg.internal_date ? new Date(msg.internal_date).toUTCString() : new Date().toUTCString() }
        ]
      },
      internalDate: msg.internal_date ? new Date(msg.internal_date).getTime().toString() : Date.now().toString(),
      sizeEstimate: 1000
    }));

    // Analyze the data
    const analytics = analyzeGmailData(gmailMessages, session.user.email || '');
    
    // Add comprehensive metadata
    const response = {
      ...analytics,
      dataSource: 'gmail_cached',
      totalCount: analytics.total_count,
      fetchedAt: new Date().toISOString(),
      daysBack,
      processingTime: `${Date.now() - startTime}ms`,
      messageCount: gmailMessages.length,
      userId: session.user.id,
      cacheInfo: {
        totalCachedMessages: messages.length,
        cacheHitRate: '100%',
        processingSpeed: `${Math.round(gmailMessages.length / ((Date.now() - startTime) / 1000))} messages/second`
      }
    };

    console.log(`✅ Analytics generated from cache in ${Date.now() - startTime}ms: ${analytics.total_count} messages processed`);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Analytics from cache error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate analytics from cache',
        processingTime: `${Date.now() - startTime}ms`,
        dataSource: 'error'
      },
      { status: 500 }
    );
  }
}
