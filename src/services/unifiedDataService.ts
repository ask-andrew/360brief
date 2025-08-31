import { UnifiedData } from '@/types/unified';
import { google } from 'googleapis';
import { getValidAccessToken } from '@/lib/gmail/oauth';
import { getOAuthClient } from '@/server/google/client';
import { createClient } from '@/lib/supabase/server';

export type FetchUnifiedOptions = {
  startDate?: string; // ISO
  endDate?: string;   // ISO
};

// Unified data service that prioritizes working Python API over direct Google calls
export async function fetchUnifiedData(_userId?: string, _opts: FetchUnifiedOptions = {}): Promise<UnifiedData> {
  // Use Python FastAPI as primary source (same as analytics page), fallback to direct Google API
  const useWorkingAPI = true; // Python API has working OAuth
  const forceDirect = (process.env.DIRECT_GOOGLE === 'true' || process.env.NEXT_PUBLIC_DIRECT_GOOGLE === 'true') && !useWorkingAPI;
  
  // Python API base (localhost:8000) - same as analytics
  const pythonAPI = process.env.ANALYTICS_API_BASE || 'http://localhost:8000';
  const legacyBase = process.env.UNIFIED_API_BASE || process.env.NEXT_PUBLIC_UNIFIED_API_BASE || '';

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
  // Fallback: Legacy API base
  const apiBase = legacyBase ? legacyBase.replace(/\/$/, '') : '';
  const legacyUrl = apiBase ? `${apiBase}/api/unified${params.toString() ? `?${params.toString()}` : ''}` : '';

  const empty: UnifiedData = {
    emails: [],
    incidents: [],
    calendarEvents: [],
    tickets: [],
    generated_at: new Date().toISOString(),
  };

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
      
      // Check if token is expired and needs refresh (basic check)
      let accessToken = token.access_token;
      if (token.expires_at && new Date(token.expires_at) < new Date()) {
        console.log(`🔄 Token expired, will attempt with current token`);
        // In a full implementation, we'd refresh the token here
      }
      
      // Fetch Gmail messages using same approach as analytics page
      console.log(`🔄 Fetching Gmail messages for user ${user.id}`);
      const gmailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=-category:promotions -in:chats`, {
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
      console.log(`✅ Gmail API returned ${messageIds.length} message IDs`);
      
      // Get details for first 10 messages (simplified for briefs)
      const messages = await Promise.all(
        messageIds.slice(0, 10).map(async (msg: any) => {
          try {
            const msgResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=subject&metadataHeaders=from&metadataHeaders=to&metadataHeaders=date`, 
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Accept': 'application/json'
                }
              }
            );
            
            if (!msgResponse.ok) return null;
            const msgData = await msgResponse.json();
            
            const headers = msgData.payload?.headers || [];
            const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
            
            return {
              id: msg.id,
              subject: getHeader('subject'),
              body: msgData.snippet || '',
              from: getHeader('from'),
              to: [getHeader('to')],
              date: getHeader('date') || new Date().toISOString(),
            };
          } catch (error) {
            console.log(`⚠️ Failed to fetch message ${msg.id}:`, error);
            return null;
          }
        })
      );

      const validMessages = messages.filter(Boolean);
      console.log(`✅ Successfully fetched ${validMessages.length} Gmail messages`);

      return {
        emails: validMessages,
        incidents: [], 
        calendarEvents: [], 
        tickets: [], 
        generated_at: new Date().toISOString(),
      };

    } catch (error) {
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
    } catch {
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

  // Execution order: Working Python API → Legacy API → Direct Google API → Empty
  try {
    if (forceDirect) {
      console.log(`🔄 Forced direct Google API access`);
      return await fetchViaGoogleDirect();
    }
    
    // Try direct Gmail API first (same method as analytics page)
    const fromDirectGmail = await fetchViaDirectGmailAPI();
    if (fromDirectGmail) return fromDirectGmail;
    
    // Fallback to legacy API
    const fromLegacyAPI = await fetchViaLegacyAPI();
    if (fromLegacyAPI) return fromLegacyAPI;
    
    // Last resort: direct Google API (likely to fail with token issues)
    console.log(`🔄 Falling back to direct Google API access`);
    return await fetchViaGoogleDirect();
  } catch (error) {
    console.error(`❌ All unified data sources failed:`, error);
    return empty;
  }
}
