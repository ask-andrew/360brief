import { UnifiedData } from '@/types/unified';
import { google } from 'googleapis';
import { getValidAccessToken } from '@/lib/gmail/oauth';
import { getOAuthClient } from '@/server/google/client';
import { createClient } from '@/lib/supabase/server';

export type FetchUnifiedOptions = {
  startDate?: string; // ISO
  endDate?: string;   // ISO
};

// Convert analytics data to UnifiedData format
function convertAnalyticsToUnifiedData(analyticsData: any): UnifiedData {
  const emails = [];
  
  // Convert priority messages to email format
  if (analyticsData.priority_messages) {
    // Add awaiting my reply messages
    if (analyticsData.priority_messages.awaiting_my_reply) {
      for (const msg of analyticsData.priority_messages.awaiting_my_reply) {
        emails.push({
          id: msg.id,
          messageId: msg.id,
          subject: msg.subject,
          body: `From: ${msg.sender}\nChannel: ${msg.channel}\nPriority: ${msg.priority}\nTimestamp: ${msg.timestamp}`,
          from: msg.sender,
          to: ['me'], // Simplified
          date: new Date(msg.timestamp || new Date()).toISOString(),
          metadata: {
            insights: {
              priority: msg.priority,
              hasActionItems: true, // Since it's awaiting reply
              isUrgent: msg.priority === 'high'
            }
          }
        });
      }
    }
    
    // Add awaiting their reply messages
    if (analyticsData.priority_messages.awaiting_their_reply) {
      for (const msg of analyticsData.priority_messages.awaiting_their_reply) {
        emails.push({
          id: msg.id,
          messageId: msg.id,
          subject: msg.subject,
          body: `From: ${msg.sender}\nChannel: ${msg.channel}\nPriority: ${msg.priority}\nTimestamp: ${msg.timestamp}`,
          from: 'me',
          to: [msg.sender],
          date: new Date(msg.timestamp || new Date()).toISOString(),
          metadata: {
            insights: {
              priority: msg.priority,
              hasActionItems: false, // Waiting for their reply
              isUrgent: msg.priority === 'high'
            }
          }
        });
      }
    }
  }

  return {
    emails,
    incidents: [],
    calendarEvents: [],
    tickets: [],
    generated_at: new Date().toISOString(),
  };
}

// Unified data service that prioritizes working Python API over direct Google calls
export async function fetchUnifiedData(_userId?: string, _opts: FetchUnifiedOptions = {}): Promise<UnifiedData> {
  // Use Next.js analytics route to get real data
  const params = new URLSearchParams();
  if (_opts.startDate) params.set('start', _opts.startDate);
  if (_opts.endDate) params.set('end', _opts.endDate);
  params.set('use_real_data', 'true'); // Force real data for briefs
  
  // Add user ID if available for Python API to identify the user
  if (_userId) {
    params.set('user_id', _userId);
  }

  // Primary: Use Next.js analytics route (same as analytics page) 
  const workingUrl = `/api/analytics${params.toString() ? `?${params.toString()}` : ''}`;

  const empty: UnifiedData = {
    emails: [],
    incidents: [],
    calendarEvents: [],
    tickets: [],
    generated_at: new Date().toISOString(),
  };

  // Try to fetch from working analytics API first
  try {
    console.log(`🔄 Fetching unified data via analytics API: ${workingUrl}`);
    
    const response = await fetch(`http://localhost:3000${workingUrl}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const analyticsData = await response.json();
      
      // Check if we got real analytics data
      if (analyticsData.total_count > 0) {
        console.log(`✅ Got real analytics data with ${analyticsData.total_count} messages`);
        return convertAnalyticsToUnifiedData(analyticsData);
      }
    }
  } catch (error) {
    console.log(`❌ Analytics API failed:`, error);
  }

  async function fetchViaDirectGmailAPI(): Promise<UnifiedData | null> {
    try {
      console.log(`🔄 Fetching Gmail data directly (same as analytics page)`);
      
      // Get current user - same as analytics page
      const supabase = await createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log(`⚠️ Authentication required for Gmail data`);
        return null;
      }
      
      // Get Gmail access token from user_tokens table (same as analytics)
      console.log(`🔄 Looking for tokens for user: ${user.id}`);
      const { data: tokens, error: tokenError } = await supabase
        .from('user_tokens')
        .select('access_token, refresh_token, expires_at, user_id, provider')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .limit(1);

      if (tokenError) {
        console.log(`❌ Token query error:`, tokenError);
        return null;
      }
      
      if (!tokens?.[0]) {
        // Debug: Check if any tokens exist for this user
        const { data: allTokens } = await supabase
          .from('user_tokens')
          .select('user_id, provider')
          .eq('user_id', user.id);
        console.log(`⚠️ No Gmail token found for user: ${user.id}, found tokens:`, allTokens);
        return null;
      }

      const token = tokens[0];
      
      // Check if token is expired and needs refresh
      let accessToken = token.access_token;
      const now = new Date();
      
      // Handle timestamp format - database stores bigint (Unix timestamp in seconds)
      let expiresAt: Date | null = null;
      if (token.expires_at) {
        try {
          // Convert bigint seconds to Date
          const timestamp = typeof token.expires_at === 'string' 
            ? parseInt(token.expires_at) 
            : token.expires_at;
          expiresAt = new Date(timestamp * 1000); // Convert seconds to milliseconds
          
          // Validate the date
          if (isNaN(expiresAt.getTime())) {
            console.log(`⚠️ Invalid timestamp: ${token.expires_at}`);
            expiresAt = null;
          }
        } catch (error) {
          console.log(`⚠️ Error parsing timestamp: ${token.expires_at}`, error);
          expiresAt = null;
        }
      }
      
      if (expiresAt && expiresAt < now) {
        console.log(`🔄 Token expired (${expiresAt.toISOString()} < ${now.toISOString()}), will attempt refresh`);
        // TODO: Implement token refresh using refresh_token
        // For now, continue with existing token
      } else if (expiresAt) {
        console.log(`✅ Token is valid until ${expiresAt.toLocaleString()}`);
      }
      
      // Fetch Gmail messages with time filtering
      console.log(`🔄 Fetching Gmail messages for user ${user.id}`);
      
      // Build time-based query parameters
      let timeQuery = 'newer_than:7d'; // Default to 1 week
      if (_opts.startDate && _opts.endDate) {
        const start = new Date(_opts.startDate);
        const end = new Date(_opts.endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 31) {
          timeQuery = `newer_than:${Math.max(1, daysDiff)}d`;
        } else {
          timeQuery = 'newer_than:31d'; // Limit to 1 month max for performance
        }
      } else if (_opts.startDate) {
        const start = new Date(_opts.startDate);
        const daysSince = Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
        timeQuery = `newer_than:${Math.min(daysSince, 31)}d`;
      }
      
      // Simplified query for debugging - just get recent messages without complex filters
      // const query = `${timeQuery} -category:{promotions} -in:chats`;
      // const encodedQuery = encodeURIComponent(query);
      
      // Simple request first to debug 403 issues
      const gmailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!gmailResponse.ok) {
        console.log(`⚠️ Gmail API responded with ${gmailResponse.status}: ${gmailResponse.statusText}`);
        return null;
      }

      const gmailData = await gmailResponse.json();
      const messageIds = gmailData.messages || [];
      console.log(`✅ Gmail API returned ${messageIds.length} message IDs (simple query)`);
      
      // Determine processing limit based on volume
      let processLimit = 50; // Baseline for high-volume processing
      if (messageIds.length > 200) {
        processLimit = 100; // Max processing for very high volume
        console.log(`📊 Extreme volume detected (${messageIds.length} messages), processing ${processLimit} most recent`);
      } else if (messageIds.length > 100) {
        processLimit = 75; // High volume processing
        console.log(`📊 High volume detected (${messageIds.length} messages), processing ${processLimit} most recent`);
      }
      
      // Implement rate limiting and timeout protection
      const MAX_PROCESSING_TIME = 30000; // 30 seconds max
      const startTime = Date.now();
      
      // Get details for messages with FULL content for action item extraction
      // Process messages sequentially to avoid rate limits
      const messages = [];
      const messagesToProcess = messageIds.slice(0, processLimit);
      
      for (let i = 0; i < messagesToProcess.length; i++) {
        // Check processing time and stop if exceeding max time
        if (Date.now() - startTime > MAX_PROCESSING_TIME) {
          console.log(`⏰ Processing time limit reached. Processed ${i} of ${processLimit} messages.`);
          break;
        }

        const msg = messagesToProcess[i];
        
        // Adaptive delay and rate limiting
        if (i > 0) {
          const delay = processLimit > 50 ? 250 : 150; // Slower for high volume
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Progress logging for high volume
        if (processLimit > 50 && i % 10 === 0) {
          console.log(`📧 Processing message ${i + 1}/${processLimit} (${Math.round((i/processLimit) * 100)}%)`);
        }
        
        try {
          // Fetch full message content, with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout per message
          
          // Start with basic format and include snippet for content
          console.log(`🔄 Fetching message ${msg.id} with token: ${accessToken.substring(0, 20)}...`);
          const msgResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=subject&metadataHeaders=from&metadataHeaders=to&metadataHeaders=date`, 
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
              },
              signal: controller.signal
            }
          );
          
          clearTimeout(timeoutId);
          
          if (!msgResponse.ok) {
            console.log(`⚠️ Gmail API message fetch failed: ${msgResponse.status} ${msgResponse.statusText} for message ${msg.id}`);
            messages.push(null);
            continue;
          }
          
          const msgData = await msgResponse.json();
          const headers = msgData.payload?.headers || [];
          const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
          
          // Use snippet as body content (Gmail provides useful snippet for each message)
          const body = msgData.snippet || '';
          console.log(`📧 Successfully fetched message ${msg.id} - snippet: ${body.substring(0, 50)}...`);
          
          messages.push({
            id: msg.id,
            subject: getHeader('subject'),
            body: body,
            from: getHeader('from'),
            to: [getHeader('to')],
            date: getHeader('date') || new Date().toISOString(),
          });
        } catch (error: any) {
          console.log(`⚠️ Failed to fetch message ${msg.id}:`, error);
          messages.push(null);
        }
      }

      console.log(`📊 Message processing stats:`, {
        totalFetched: messages.length,
        nullMessages: messages.filter(m => m === null).length,
        validObjects: messages.filter(m => m !== null && typeof m === 'object').length,
        withIds: messages.filter(m => m !== null && typeof m === 'object' && m.id).length,
        withFrom: messages.filter(m => m !== null && typeof m === 'object' && m.id && m.from).length
      });
      
      const validMessages = messages.filter((msg): msg is Exclude<typeof msg, null> => 
        msg !== null && 
        typeof msg === 'object' && 
        msg.id &&
        msg.from
        // Don't require subject or body - they might be empty but message is still valid
      );
      console.log(`✅ Successfully fetched ${validMessages.length} Gmail messages`);

      return {
        emails: validMessages,
        incidents: [], 
        calendarEvents: [], 
        tickets: [], 
        generated_at: new Date().toISOString(),
      };

    } catch (error: any) {
      console.log(`❌ Direct Gmail API failed:`, error);
      return null;
    }
  }

  async function fetchViaLegacyAPI(): Promise<UnifiedData | null> {
    if (!legacyUrl) return null;
    try {
      const res = await fetch(legacyUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();
      return mapUnifiedData(data);
    } catch (error: any) {
      return null;
    }
  }

  function transformAnalyticsToUnified(analyticsData: any): UnifiedData {
    // Transform Python analytics API response to UnifiedData format
    const emails = analyticsData?.messages?.map((msg: any) => ({
      id: String(msg?.id || Math.random()),
      subject: String(msg?.subject || ''),
      body: String(msg?.body || msg?.snippet || ''),
      from: String(msg?.from || ''),
      to: Array.isArray(msg?.to) ? msg.to.map((t: any) => String(t)) : [String(msg?.to || '')],
      date: String(msg?.date || msg?.timestamp || new Date().toISOString()),
    })) || [];

    return {
      emails,
      incidents: [], // Analytics API doesn't provide incidents
      calendarEvents: [], // Analytics API doesn't provide calendar
      tickets: [], // Analytics API doesn't provide tickets
      generated_at: new Date().toISOString(),
    };
  }

  function mapUnifiedData(data: any): UnifiedData {
    // Map with guards to the expected UnifiedData shape
    const mapped: UnifiedData = {
      emails: Array.isArray(data?.emails) ? data.emails.map((e: any) => ({
        id: String(e?.id ?? ''),
        subject: String(e?.subject ?? ''),
        body: String(e?.body ?? ''),
        from: String(e?.from ?? ''),
        to: Array.isArray(e?.to) ? e.to.map((t: any) => String(t)) : [],
        date: String(e?.date ?? ''),
      })) : [],
      incidents: Array.isArray(data?.incidents) ? data.incidents.map((i: any) => ({
        id: String(i?.id ?? ''),
        title: String(i?.title ?? ''),
        severity: String(i?.severity ?? 'sev2'),
        startedAt: i?.startedAt ? String(i.startedAt) : undefined,
        endedAt: i?.endedAt ? String(i.endedAt) : undefined,
        affectedUsers: typeof i?.affectedUsers === 'number' ? i.affectedUsers : undefined,
        arrAtRisk: typeof i?.arrAtRisk === 'number' ? i.arrAtRisk : undefined,
        description: i?.description ? String(i.description) : undefined,
      })) : [],
      calendarEvents: Array.isArray(data?.calendarEvents) ? data.calendarEvents.map((c: any) => ({
        id: String(c?.id ?? ''),
        title: String(c?.title ?? ''),
        description: c?.description ? String(c.description) : undefined,
        start: String(c?.start ?? ''),
        end: String(c?.end ?? ''),
        attendees: Array.isArray(c?.attendees) ? c.attendees.map((a: any) => String(a)) : undefined,
        location: c?.location ? String(c.location) : undefined,
      })) : [],
      tickets: Array.isArray(data?.tickets) ? data.tickets.map((t: any) => ({
        id: String(t?.id ?? ''),
        title: String(t?.title ?? ''),
        status: String(t?.status ?? 'open'),
        priority: String(t?.priority ?? 'p2'),
        dueDate: t?.dueDate ? String(t.dueDate) : undefined,
        owner: t?.owner ? String(t.owner) : undefined,
        description: t?.description ? String(t.description) : undefined,
      })) : [],
      generated_at: String(data?.generated_at ?? new Date().toISOString()),
    };

    return mapped;
  }

  async function fetchViaGoogleDirect(): Promise<UnifiedData> {
    // Resolve current user id if not provided
    let userId = _userId;
    if (!userId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return empty;
      userId = user.id;
    }

    // Auth client + token
    const accessToken = await getValidAccessToken(userId!);
    const oauth2 = getOAuthClient();
    oauth2.setCredentials({ access_token: accessToken });

    // Gmail: fetch recent messages (last 7 days), max 25
    const gmail = google.gmail({ version: 'v1', auth: oauth2 });
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const listResp = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 25,
      q: `newer_than:7d -category:{promotions} -in:chats`,
    });
    const messages = await Promise.all(
      (listResp.data.messages || []).slice(0, 25).map(async (m) => {
        if (!m.id) return null;
        const msg = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['subject', 'from', 'to', 'date'] });
        const headers = msg.data.payload?.headers || [];
        const get = (name: string) => headers.find((h) => (h.name || '').toLowerCase() === name.toLowerCase())?.value || '';
        const dateStr = get('date');
        const date = dateStr ? new Date(dateStr) : undefined;
        return {
          id: m.id,
          subject: get('subject') || '',
          body: '',
          from: get('from') || '',
          to: (get('to') || '').split(',').map((t) => t.trim()).filter(Boolean),
          date: date ? date.toISOString() : sevenDaysAgo.toISOString(),
        };
      })
    );

    // Calendar: upcoming events next 7 days, max 25
    const calendar = google.calendar({ version: 'v3', auth: oauth2 });
    const now = new Date();
    const inSeven = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const calResp = await calendar.events.list({
      calendarId: 'primary',
      maxResults: 25,
      singleEvents: true,
      timeMin: now.toISOString(),
      timeMax: inSeven.toISOString(),
      orderBy: 'startTime',
    });
    const events = (calResp.data.items || []).map((ev) => ({
      id: String(ev.id || ''),
      title: String(ev.summary || ''),
      description: ev.description ? String(ev.description) : undefined,
      start: String(ev.start?.dateTime || ev.start?.date || ''),
      end: String(ev.end?.dateTime || ev.end?.date || ''),
      attendees: Array.isArray(ev.attendees) ? ev.attendees.map((a) => String(a.email || '')) : undefined,
      location: ev.location ? String(ev.location) : undefined,
    }));

    const unified: UnifiedData = {
      emails: messages.filter(Boolean) as any,
      incidents: [],
      calendarEvents: events as any,
      tickets: [],
      generated_at: new Date().toISOString(),
    };
    return unified;
  }

  // NEW: Function to use the working analytics API (same as analytics page)
  async function fetchViaWorkingAnalyticsAPI(): Promise<UnifiedData | null> {
    try {
      console.log(`🔄 Using working analytics API route (same as analytics page)`);
      
      // Fix: Use absolute URL for server-side fetch
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://360brief.com';
      const fullUrl = `${baseUrl}${workingUrl}`;
      
      console.log(`🔄 Fetching from: ${fullUrl}`);
      const res = await fetch(fullUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (!res.ok) {
        console.log(`⚠️ Analytics API response not ok: ${res.status} ${res.statusText}`);
        return null;
      }
      const data = await res.json();
      return transformAnalyticsToUnified(data);
    } catch (error: any) {
      console.log(`⚠️ Analytics API failed:`, error);
      return null;
    }
  }

  // Email-focused execution: Prioritize reliable email data over complex fallbacks
  try {
    if (forceDirect) {
      console.log(`🔄 Forced direct Google API access`);
      return await fetchViaGoogleDirect();
    }
    
    // PRIMARY: Try working analytics API first (Python service on localhost:8000)
    console.log(`🔄 Trying analytics API for real data`);
    const fromAnalyticsAPI = await fetchViaWorkingAnalyticsAPI();
    if (fromAnalyticsAPI && fromAnalyticsAPI.emails.length > 0) {
      console.log(`✅ Got ${fromAnalyticsAPI.emails.length} emails from analytics API`);
      return fromAnalyticsAPI;
    }
    
    // SECONDARY: Try direct Gmail API with better error handling
    console.log(`🔄 Fallback to direct Gmail API`);
    const fromDirectGmail = await fetchViaDirectGmailAPI();
    if (fromDirectGmail && fromDirectGmail.emails.length > 0) {
      console.log(`✅ Got ${fromDirectGmail.emails.length} emails from direct Gmail`);
      return fromDirectGmail;
    }
    
    // TERTIARY: Legacy API (if configured)
    if (legacyUrl) {
      console.log(`🔄 Fallback to legacy API`);
      const fromLegacyAPI = await fetchViaLegacyAPI();
      if (fromLegacyAPI && fromLegacyAPI.emails.length > 0) {
        console.log(`✅ Got ${fromLegacyAPI.emails.length} emails from legacy API`);
        return fromLegacyAPI;
      }
    }
    
    // LAST RESORT: Direct Google API
    console.log(`🔄 Final fallback to direct Google API`);
    const fromGoogleDirect = await fetchViaGoogleDirect();
    if (fromGoogleDirect.emails.length > 0) {
      console.log(`✅ Got ${fromGoogleDirect.emails.length} emails from Google API`);
      return fromGoogleDirect;
    }
    
    console.log(`⚠️ No email data available from direct API, trying fallback analytics conversion`);
    // Final fallback: try to get sample data in the right format for briefs
    try {
      const fallbackResponse = await fetch(`http://localhost:3000/api/analytics?use_real_data=true`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.total_count > 0) {
          console.log(`✅ Using fallback analytics data for briefs with ${fallbackData.total_count} messages`);
          return convertAnalyticsToUnifiedData(fallbackData);
        }
      }
    } catch (error) {
      console.log(`❌ Fallback analytics failed:`, error);
    }
    
    return empty;
  } catch (error) {
    console.error(`❌ Email data fetch failed:`, error);
    return empty;
  }
}
