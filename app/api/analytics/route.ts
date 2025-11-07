import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';

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
function extractTopProjects(data: any[]): Array<{name: string, messageCount: number}> {
  const projectKeywords = ['project', 'initiative', 'launch', 'sprint', 'q1', 'q2', 'q3', 'q4'];
  const projectCounts: {[key: string]: number} = {};
  
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
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, messageCount]) => ({ name, messageCount }));
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
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    }
  });
  
  const totalCount = data.length;
  const topSenders = Object.entries(senders)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([sender, count]) => ({ name: sender, count }));
    
  // Calculate peak hour
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
    avg_response_time_minutes: calculateAverageResponseTime(data, userEmail),
    missed_messages: 0, // This would require tracking read status
    focus_ratio: focusRatio,
    external_percentage: externalPercentage,
    internal_percentage: internalPercentage,
    top_projects: extractTopProjects(data),
    reconnect_contacts: [], // This would require tracking contacts
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
      meetings: { change: 0, direction: 'up' as const }
    },
    priority_messages: {
      awaiting_my_reply: [], // This would require tracking message threads
      awaiting_their_reply: []
    },
    processing_metadata: {
      source: 'gmail_direct',
      processed_at: new Date().toISOString(),
      message_count: totalCount,
      days_analyzed: daysBack,
      is_real_data: true
    }
  };
}

export async function GET(request: NextRequest) {
  console.log('🚀 Analytics API START:', new Date().toISOString());

  try {
    const searchParams = request.nextUrl.searchParams;
    const daysBack = parseInt(searchParams.get('days_back') || '7');
    console.log('🔍 Analytics API params:', { daysBack });

    // Debug request context
    console.log('🔍 Request context:', {
      hasCookieHeader: !!request.headers.get('cookie'),
      cookiePreview: request.headers.get('cookie')?.substring(0, 100),
      userAgent: request.headers.get('user-agent')?.substring(0, 50)
    });

    // Create Supabase client and get user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }

    // Fetch Gmail OAuth tokens
    let { data: tokenRows, error: tokenError } = await supabase
      .from('user_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .limit(1);

    if (tokenError) {
      return NextResponse.json({ error: `Token query failed: ${tokenError.message}` }, { status: 500 });
    }

    // If no stored token row, try refresh token from user metadata and persist
    if (!tokenRows || tokenRows.length === 0) {
      const meta: any = (user as any)?.user_metadata || {};
      const refreshToken = meta.google_refresh_token || meta.gmail_refresh_token || meta.google?.refresh_token;
      if (!refreshToken) {
        return NextResponse.json({ error: 'Gmail not connected' }, { status: 409 });
      }
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        const accessToken = credentials.access_token as string;
        const expiry = credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null;
        await supabase
          .from('user_tokens')
          .upsert({
            user_id: user.id,
            provider: 'google',
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiry,
            updated_at: Math.floor(Date.now() / 1000),
          }, { onConflict: 'user_id,provider' } as any);
        // Re-query to proceed with normal flow
        const requery = await supabase
          .from('user_tokens')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .limit(1);
        tokenRows = requery.data || [];
      } catch (e) {
        return NextResponse.json({ error: 'Failed to exchange refresh token' }, { status: 502 });
      }
    }

    const token = (tokenRows as any)[0];

    // Refresh token if needed
    const now = Math.floor(Date.now() / 1000);
    const expiresAtTimestamp = typeof token.expires_at === 'string'
      ? parseInt(token.expires_at, 10)
      : typeof token.expires_at === 'number'
        ? token.expires_at
        : null;
    const needsRefresh = expiresAtTimestamp && (expiresAtTimestamp < now || expiresAtTimestamp < (now + 600));

    if (needsRefresh) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({
          access_token: token.access_token,
          refresh_token: token.refresh_token,
        });
        const { credentials } = await oauth2Client.refreshAccessToken();
        await supabase
          .from('user_tokens')
          .update({
            access_token: credentials.access_token,
            expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
            updated_at: Math.floor(Date.now() / 1000),
          })
          .eq('user_id', user.id)
          .eq('provider', 'google');
        token.access_token = credentials.access_token as string;
      } catch (refreshError) {
        return NextResponse.json({ error: 'Token refresh failed' }, { status: 502 });
      }
    }

    // Fetch Gmail messages
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token.access_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client }); // Initialize Google Calendar API client

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    // Progressive passes (mirrors briefs endpoint resilience)
    type Attempt = { name: string; maxResults: number; listed: number; processed: number; error?: string };
    const attempts: Attempt[] = [];
    for (const pass of passes) {
      if (pass.type === 'gmail') {
        if (messages.length >= 100) break;
        let listed: any[] = [];
        try {
          const listResp = await gmail.users.messages.list({ userId: 'me', maxResults: pass.maxResults });
          listed = listResp.data.messages || [];
        } catch (err: any) {
          attempts.push({ name: pass.name, maxResults: pass.maxResults, listed: 0, processed: 0, error: err?.message || 'list_failed' });
          continue;
        }

        let processed = 0;
        for (let i = 0; i < listed.length && messages.length < 100; i++) {
          const item = listed[i];
          try {
            const meta = await gmail.users.messages.get({
              userId: 'me',
              id: item.id!,
              format: 'metadata',
              metadataHeaders: ['From', 'To', 'Subject', 'Date']
            });
            // Client-side filters similar to briefs
            const headers = (meta.data.payload?.headers || []) as Array<{ name?: string | null; value?: string | null }>;
            const header = (name: string) => {
              const h = headers.find(h => (h?.name || '').toLowerCase() === name.toLowerCase());
              return (h?.value as string) || '';
            };
            const subject = header('subject');
            const from = header('from');
            const dateStr = header('date');
            const date = dateStr ? new Date(dateStr) : new Date();
            const isPromo = meta.data.labelIds?.includes('CATEGORY_PROMOTIONS') || meta.data.labelIds?.includes('CATEGORY_SOCIAL');
            const isNoreply = /noreply|no-reply/i.test(from);
            if (pass.windowDays) {
              const cutoff = Date.now() - pass.windowDays * 24 * 60 * 60 * 1000;
              if (date.getTime() < cutoff) { continue; }
            }
            if (pass.skipPromotions && isPromo) continue;
            if (pass.skipNoreply && isNoreply) continue;

            // Keep metadata shape expected by convertGmailToAnalytics
            const normalized = {
              id: meta.data.id,
              threadId: meta.data.threadId,
              labelIds: meta.data.labelIds || [],
              snippet: meta.data.snippet || '',
              internalDate: String(date.getTime()),
              payload: { headers: headers as any }
            };
            messages.push(normalized);
            processed++;
            if (listed.length > 1) await new Promise(r => setTimeout(r, 60));
          } catch (e) {
            // ignore single failure
          }
        }
        attempts.push({ name: pass.name, maxResults: pass.maxResults, listed: listed.length, processed });
        if (messages.length >= 100) break; // good enough for analytics
      } else if (pass.type === 'calendar') {
        // Fetch calendar events
        if (calendarEvents.length >= 100) break; // Limit calendar events too
        try {
          const calendarResp = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: pass.maxResults,
          });
          const events = calendarResp.data.items || [];
          events.forEach(event => {
            calendarEvents.push({
              id: event.id,
              summary: event.summary,
              start: event.start?.dateTime || event.start?.date,
              end: event.end?.dateTime || event.end?.date,
              attendees: event.attendees?.map(att => att.email) || [],
              isOrganizer: event.organizer?.email === user.email,
              platform: 'Google Calendar',
            });
          });
          attempts.push({ name: pass.name, maxResults: pass.maxResults, listed: events.length, processed: events.length });
        } catch (err: any) {
    }

    if (messages.length === 0 && calendarEvents.length === 0) {
      const analyticsData = convertDataToAnalytics([], daysBack, user.email); // Still using convertGmailToAnalytics for now
      analyticsData.dataSource = 'gmail_real_data';
      analyticsData.message = `Real Gmail data: 0 messages analyzed (last ${daysBack} days)`;
      analyticsData.processing_metadata = {
        source: 'gmail_direct',
        processed_at: new Date().toISOString(),
        message_count: 0,
        days_analyzed: daysBack,
        is_real_data: true
      };
      return NextResponse.json(analyticsData, { status: 200, headers: { 'Cache-Control': 'no-cache' } });
    }

    // Combine messages and calendar events for analytics processing
    const combinedData = [...messages, ...calendarEvents];

    const analyticsData = convertDataToAnalytics(combinedData, daysBack, user.email); // Still using convertGmailToAnalytics for now
    analyticsData.dataSource = 'gmail_real_data';
    analyticsData.message = `Real Gmail data: ${messages.length} messages and ${calendarEvents.length} calendar events analyzed (last ${daysBack} days)`;
    analyticsData.processing_metadata = {
      source: 'gmail_direct',
      processed_at: new Date().toISOString(),
      message_count: messages.length + calendarEvents.length,
      days_analyzed: daysBack,
      is_real_data: true
    };

    return NextResponse.json(analyticsData, { status: 200, headers: { 'Cache-Control': 'public, max-age=300' } });