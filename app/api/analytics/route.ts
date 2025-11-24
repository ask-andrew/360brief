import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OAuth2Client } from 'google-auth-library';
import { ensureValidAccessToken } from '@/services/analytics/tokens';
import { getCache, setCache } from '@/services/analytics/cache';
import { fetchGmailMessages } from '@/services/analytics/gmail';
import { fetchCalendarEvents } from '@/services/analytics/calendar';
import { AnalyticsQuerySchema } from '@/services/analytics/schemas';
import { computeAnalytics } from '@/services/analytics/processor';
import type { AnalyticsResponse } from '@/types/analytics';

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second initial delay
const DEFAULT_DAYS_BACK = 7;

/**
 * Helper function for retryable async operations with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      console.error('Max retries reached, failing with error:', error);
      throw error;
    }
    console.log(`Retrying (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * Validate and normalize query params with zod
 */
function parseRequestParams(searchParams: URLSearchParams): { daysBack: number; useMock: boolean; useRealData: boolean } {
  const raw = Object.fromEntries(searchParams.entries());
  // Support both daysBack and days_back; prefer daysBack
  const daysBackInput = raw.daysBack ?? raw.days_back;
  const result = AnalyticsQuerySchema.safeParse({
    daysBack: daysBackInput,
    useMock: raw.useMock,
    useRealData: raw.useRealData,
  });
  if (!result.success) {
    // Fallback to defaults if invalid
    return { daysBack: DEFAULT_DAYS_BACK, useMock: false, useRealData: true };
  }
  const { daysBack, useMock, useRealData } = result.data;
  return { daysBack, useMock, useRealData };
}

// Gmail and Calendar fetchers are provided by services in src/services/analytics

/**
 * Main API route handler
 */
export async function GET(request: NextRequest) {
  console.log('🔍 Analytics API called');

  try {
    const { searchParams } = new URL(request.url);
    const { daysBack, useMock } = parseRequestParams(searchParams);

    // For testing with mock data
    if (useMock) {
      console.log('Using mock data for analytics');
      const mockData = {
        message: 'Mock analytics data',
        total_count: 42,
        period_days: daysBack,
        daily_counts: Array(daysBack).fill(0).map(() => Math.floor(Math.random() * 10)),
        top_senders: [
          { name: 'team@example.com', count: 15 },
          { name: 'notifications@example.com', count: 12 },
          { name: 'support@example.com', count: 8 },
        ],
        categories: {
          'updates': 25,
          'notifications': 12,
          'alerts': 5,
        },
        dataSource: 'mock',
        processing_metadata: {
          source: 'mock',
          processed_at: new Date().toISOString(),
          message_count: 42,
          days_analyzed: daysBack,
          is_real_data: false,
        },
      };

      return NextResponse.json(mockData, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    // Initialize Supabase client (server-side)
    const supabase = await createClient();

    // Get user session with retry logic
    let session;
    try {
      const result = await withRetry(async () => {
        const res = await supabase.auth.getSession();
        if (res.error) throw res.error;
        return res;
      });
      session = result.data.session;
    } catch (sessionError: any) {
      console.error('🔒 Authentication error:', sessionError?.message || 'No active session');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!session) {
      console.error('🔒 No active session found');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Get user profile
    let user;
    try {
      const result = await withRetry(async () => {
        const res = await supabase.auth.getUser();
        if (res.error) throw res.error;
        return res;
      });
      user = result.data.user;
    } catch (userError: any) {
      console.error('🔍 User not found:', userError?.message || 'No user data');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!user) {
      console.error('🔍 No user data available');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    // Cache: return cached analytics if present
    const cacheKey = `analytics:${user.id}:${daysBack}`;
    const cached = getCache<AnalyticsResponse>(cacheKey);
    if (cached && !useMock) {
      console.log('✅ Returning cached analytics data');
      return NextResponse.json(cached, { headers: { 'Cache-Control': 'no-store' } });
    }

    // PRE-FLIGHT CHECK: Verify Gmail tokens exist before attempting to fetch
    console.log('🔍 Checking if user has Gmail tokens...');
    const { data: tokenCheck, error: tokenCheckError } = await supabase
      .from('user_tokens')
      .select('id, expires_at, refresh_token')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .limit(1);

    if (tokenCheckError) {
      console.error('❌ Token check query failed:', tokenCheckError);
    }

    if (!tokenCheck || tokenCheck.length === 0) {
      console.log('⚠️ No Gmail tokens found for user. Returning empty analytics with connection prompt.');
      const emptyResponse: AnalyticsResponse = {
        message: 'Please connect your Gmail account to see analytics',
        total_count: 0,
        period_days: daysBack,
        daily_counts: [],
        top_senders: [],
        categories: {},
        dataSource: 'none',
        processing_metadata: {
          source: 'api',
          processed_at: new Date().toISOString(),
          message_count: 0,
          days_analyzed: daysBack,
          is_real_data: false,
        },
        error: 'No Gmail connection found',
      };

      return NextResponse.json(emptyResponse, {
        status: 200, // Return 200, not 400, so frontend can display empty state
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    console.log('✅ Gmail tokens found. Proceeding to fetch and validate...');

    // Ensure valid Google access token with TIMEOUT PROTECTION
    let oauth2Client: OAuth2Client;
    try {
      console.log('🔄 Fetching valid access token (10s timeout)...');

      // Wrap in a timeout promise to prevent indefinite hanging
      const tokenPromise = ensureValidAccessToken(supabase as any, user.id);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Token fetch timeout - took longer than 10 seconds')), 10000)
      );

      const { oauth2 } = await Promise.race([tokenPromise, timeoutPromise]) as { oauth2: OAuth2Client };
      oauth2Client = oauth2;
      console.log('✅ Valid access token obtained');

    } catch (error: any) {
      console.error('❌ Failed to get valid access token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to authenticate with Gmail';

      // If it's a timeout or token error, ask user to reconnect
      if (errorMessage.includes('timeout') || errorMessage.includes('refresh token')) {
        const reconnectResponse: AnalyticsResponse = {
          message: 'Gmail connection expired. Please reconnect your account.',
          total_count: 0,
          period_days: daysBack,
          daily_counts: [],
          top_senders: [],
          categories: {},
          dataSource: 'none',
          processing_metadata: {
            source: 'api',
            processed_at: new Date().toISOString(),
            message_count: 0,
            days_analyzed: daysBack,
            is_real_data: false,
          },
          error: 'Gmail connection expired',
        };

        return NextResponse.json(reconnectResponse, {
          status: 200,
          headers: { 'Cache-Control': 'no-store' }
        });
      }

      // For other errors, return generic error
      return NextResponse.json(
        {
          error: 'Failed to authenticate with Gmail',
          details: errorMessage
        },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Fetch data from Google APIs with pagination and batching
    console.log('📧 Fetching Gmail messages and calendar events...');
    const [gmailMessages, calendarEvents] = await Promise.all([
      fetchGmailMessages(oauth2Client, daysBack, 200), // Limit to 200 messages
      fetchCalendarEvents(oauth2Client, {
        daysBack,
        maxResults: 1000, // Limit to 1000 events
        timeZone: 'America/Chicago' // Set appropriate timezone
      }),
    ]);

    console.log(`✅ Fetched ${gmailMessages.length} Gmail messages and ${calendarEvents.length} calendar events`);

    // Process and combine data via analytics processor service
    const analyticsData: AnalyticsResponse = computeAnalytics({
      gmail: gmailMessages as any,
      calendar: calendarEvents as any,
      daysBack,
      userEmail: user.email ?? undefined,
    });

    console.log('✅ Analytics computed successfully');

    // Cache the computed analytics briefly
    setCache(cacheKey, analyticsData, 60 * 1000);
    return NextResponse.json(analyticsData, {
      headers: { 'Cache-Control': 'no-store' },
    });

  } catch (error) {
    console.error('🚨 Analytics API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        details: errorMessage
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

// Function to generate mock analytics data when no real data is available
function generateMockAnalyticsData(): any {
  const now = new Date();
  const daysBack = 7;

  return {
    message: "Mock analytics data - Connect Gmail for real insights",
    total_count: 45,
    period_days: daysBack,
    daily_counts: [8, 12, 6, 9, 10, 0, 0], // Last 7 days
    top_senders: [
      { name: "Team Updates", count: 12 },
      { name: "Project Manager", count: 8 },
      { name: "Client Communications", count: 6 },
      { name: "System Notifications", count: 4 }
    ],
    categories: {
      work: 28,
      personal: 10,
      notifications: 7
    },
    dataSource: 'mock_data',
    processing_metadata: {
      source: 'nextjs_builtin_mock',
      processed_at: now.toISOString(),
      message_count: 45,
      days_analyzed: daysBack,
      is_real_data: false
    }
  }
}

// Helper function to calculate average response time (simplified)
function calculateAverageResponseTime(data: any[], userEmail: string): number {
  // This is a simplified version - a real implementation would track thread replies
  // For now, return a reasonable default based on message volume
  const messageCount = data.length;
  if (messageCount === 0) return 0;

  // Base response time in minutes, decreases with more messages (simulating busier days)
  return Math.max(30, 120 - Math.min(100, messageCount));
}

// Helper function to extract top projects from message subjects
function extractTopProjects(data: any[]): Array<{ name: string, messageCount: number }> {
  const projectKeywords = ['project', 'initiative', 'launch', 'sprint', 'q1', 'q2', 'q3', 'q4'];
  const projectCounts: { [key: string]: number } = {};

  data.forEach(item => {
    if (item.platform === 'Google Calendar') {
      // Calendar events don't have subjects in the same way emails do
      // For now, skip calendar events for project extraction
      return;
    }
    try {
      const subject = (item.payload?.headers || [])
        .find((h: any) => h.name === 'Subject')?.value || '';

      // Simple keyword matching - in a real app, this would be more sophisticated
      const words = subject.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (projectKeywords.some(kw => word.includes(kw))) {
          projectCounts[word] = (projectCounts[word] || 0) + 1;
        }
      }
    } catch (e) {
      // Skip errors
    }
  });

  return Object.entries(projectCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, messageCount]) => ({ name, messageCount }));
}

// Helper function to calculate reply times
function calculateReplyTimes(messages: any[], userEmail: string): number[] {
  const replyTimes: number[] = [];
  const threads: { [threadId: string]: any[] } = {};

  // Group messages by threadId
  messages.forEach(msg => {
    if (msg.threadId) {
      if (!threads[msg.threadId]) {
        threads[msg.threadId] = [];
      }
      threads[msg.threadId].push(msg);
    }
  });

  for (const threadId in threads) {
    const threadMessages = threads[threadId].sort((a: any, b: any) => parseInt(a.internalDate) - parseInt(b.internalDate));

    let executiveLastOutgoing: any = null;
    let lastIncomingToExecutive: any = null;

    threadMessages.forEach((msg: any) => {
      const headers = msg.payload?.headers || [];
      const fromHeader = headers.find((h: any) => h.name === 'From');
      const toHeader = headers.find((h: any) => h.name === 'To');

      const isOutgoing = fromHeader?.value.includes(userEmail);
      const isIncoming = toHeader?.value.includes(userEmail) && !isOutgoing;

      const messageTime = parseInt(msg.internalDate);

      if (isOutgoing) {
        executiveLastOutgoing = { msg, messageTime };
        // If there was a previous incoming message, calculate reply time
        if (lastIncomingToExecutive) {
          replyTimes.push(messageTime - lastIncomingToExecutive.messageTime);
          lastIncomingToExecutive = null; // Reset after reply
        }
      } else if (isIncoming) {
        lastIncomingToExecutive = { msg, messageTime };
        // If executive had sent a message, calculate reply time
        if (executiveLastOutgoing) {
          replyTimes.push(messageTime - executiveLastOutgoing.messageTime);
          executiveLastOutgoing = null; // Reset after reply
        }
      }
    });
  }

  // Convert milliseconds to minutes
  return replyTimes.map(time => Math.round(time / (1000 * 60)));
}

function getPlainTextBody(payload: any): string {
  if (!payload || !payload.parts) {
    return payload?.body?.data ? Buffer.from(payload.body.data, 'base64').toString('utf8') : '';
  }

  for (const part of payload.parts) {
    if (part.mimeType === 'text/plain' && part.body && part.body.data) {
      return Buffer.from(part.body.data, 'base64').toString('utf8');
    }
    if (part.parts) {
      const result = getPlainTextBody(part);
      if (result) return result;
    }
  }
  return '';
}

// Function to convert Gmail data to analytics format
function convertDataToAnalytics(data: any[], daysBack: number = 7, userEmail: string): any {
  const now = new Date();
  const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

  // Count messages by day and track senders
  const dailyCounts: { [key: string]: number } = {};
  const senders: { [key: string]: number } = {};
  const domains: { [key: string]: number } = {};
  const hours: { [key: string]: number } = {};
  let totalInbound = 0;
  let totalOutbound = 0;
  const threadsData: { [threadId: string]: any[] } = {}; // New object to store messages grouped by thread

  data.forEach(item => {
    if (item.platform === 'Google Calendar') {
      // Process calendar event
      const date = new Date(item.start);
      const dayKey = date.toISOString().split('T')[0];
      const hour = date.getHours();

      dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;
      hours[hour] = (hours[hour] || 0) + 1;

      // For calendar events, attendees are considered contacts
      item.attendees.forEach((attendeeEmail: string) => {
        if (attendeeEmail !== userEmail) {
          senders[attendeeEmail] = (senders[attendeeEmail] || 0) + 1;
          const domain = attendeeEmail.split('@')[1] || '';
          if (domain) {
            domains[domain] = (domains[domain] || 0) + 1;
          }
        }
      });

      // Determine if event is inbound or outbound (organizer vs attendee)
      if (item.isOrganizer) {
        totalOutbound++; // Executive organized the meeting
      } else {
        totalInbound++; // Executive is an attendee
      }

    } else { // Assume it's an email message
      try {
        const date = new Date(parseInt(item.internalDate));
        const dayKey = date.toISOString().split('T')[0];
        const hour = date.getHours();

        // Count messages by day and hour
        dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;
        hours[hour] = (hours[hour] || 0) + 1;

        // Extract sender and recipient information
        const headers = item.payload?.headers || [];
        const fromHeader = headers.find((h: any) => h.name === 'From');
        const toHeader = headers.find((h: any) => h.name === 'To');

        if (fromHeader && fromHeader.value) {
          // Extract email address if in format "Name <email@example.com>"
          const emailMatch = fromHeader.value.match(/<([^>]+)>/);
          const email = emailMatch ? emailMatch[1] : fromHeader.value;
          const domain = email.split('@')[1] || '';

          // Track senders and domains
          senders[email] = (senders[email] || 0) + 1;
          if (domain) {
            domains[domain] = (domains[domain] || 0) + 1;
          }

          // Determine if message is inbound or outbound
          if (toHeader && toHeader.value.includes(userEmail) && !fromHeader.value.includes(userEmail)) {
            totalInbound++;
          } else if (fromHeader.value.includes(userEmail)) {
            totalOutbound++;
          }

          // Group messages by threadId for later processing
          if (item.threadId) {
            if (!threadsData[item.threadId]) {
              threadsData[item.threadId] = [];
            }
            threadsData[item.threadId].push(item);
          }
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    }
  });

  const totalCount = data.length;
  const topSenders = Object.entries(senders)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([sender, count]) => ({ name: sender, count }));

  const emailMessages = data.filter(item => item.platform !== 'Google Calendar');
  const replyTimes = calculateReplyTimes(emailMessages, userEmail);
  const avgReplyTime = replyTimes.length > 0 ? replyTimes.reduce((sum, time) => sum + time, 0) / replyTimes.length : 0;

  const peakHour = Object.entries(hours).reduce((a, b) => a[1] > b[1] ? a : b, ['12', 0])[0];

  // Calculate external vs internal percentage
  const internalDomains = ['gmail.com', 'company.com']; // Add your company domains
  let internalCount = 0;
  Object.entries(domains).forEach(([domain, count]) => {
    if (internalDomains.some(d => domain.endsWith(d))) {
      internalCount += count;
    }
  });
  const externalCount = totalCount - internalCount;
  const externalPercentage = Math.round((externalCount / totalCount) * 100) || 0;
  const internalPercentage = 100 - externalPercentage;

  // Calculate focus ratio (placeholder - could be based on time between messages)
  const focusRatio = Math.min(100, Math.max(60, 100 - Math.floor(totalCount / 10)));

  return {
    total_count: totalCount,
    inbound_count: totalInbound,
    outbound_count: totalOutbound,
    avg_response_time_minutes: avgReplyTime,
    missed_messages: 0, // This would require tracking read status
    focus_ratio: focusRatio,
    external_percentage: externalPercentage,
    internal_percentage: internalPercentage,
    top_projects: extractTopProjects(data),
    reconnect_contacts: [], // This would require tracking contacts
    threads_summary: threadsData, // New field for thread-level data
    message_distribution: {
      by_day: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })),
      by_sender: topSenders
    },
    channel_analytics: {
      by_channel: [
        { name: 'Email', count: totalCount, percentage: 100 }
      ],
      by_time: Object.entries(hours).map(([hour, count]) => ({
        hour: `${hour.padStart(2, '0')}:00`,
        count
      })).sort((a, b) => a.hour.localeCompare(b.hour))
    },
    sentiment_analysis: {
      positive: 0, // This would require actual sentiment analysis
      neutral: 100,
      negative: 0,
      overall_trend: 'neutral' as const,
    },
    recent_trends: {
      messages: { change: 0, direction: 'up' as const },
      response_time: { change: 0, direction: 'down' as const },
      meetings: { change: 0, direction: 'up' as const },
      avg_reply_time: avgReplyTime // Add avgReplyTime here
    },
    priority_messages: {
      awaiting_my_reply: [], // This would require tracking message threads
      awaiting_their_reply: []
    },
  };
}