import { UnifiedData } from '@/types/unified';
import { google } from 'googleapis';
import { getValidAccessToken } from '@/lib/gmail/oauth';
import { getOAuthClient } from '@/server/google/client';
import { createClient } from '@/lib/supabase/server';

export type FetchUnifiedOptions = {
  startDate?: string; // ISO
  endDate?: string;   // ISO
};

// Minimal TS UnifiedDataService. Tries Supabase (if available), falls back to empty.
export async function fetchUnifiedData(_userId?: string, _opts: FetchUnifiedOptions = {}): Promise<UnifiedData> {
  // Choose data source: direct Google APIs (recommended for beta) or FastAPI fallback
  const forceDirect = (process.env.DIRECT_GOOGLE === 'true' || process.env.NEXT_PUBLIC_DIRECT_GOOGLE === 'true');
  const base = process.env.UNIFIED_API_BASE || process.env.NEXT_PUBLIC_UNIFIED_API_BASE || '';

  const params = new URLSearchParams();
  if (_opts.startDate) params.set('start', _opts.startDate);
  if (_opts.endDate) params.set('end', _opts.endDate);

  const apiBase = base ? base.replace(/\/$/, '') : '';
  const url = apiBase ? `${apiBase}/api/unified${params.toString() ? `?${params.toString()}` : ''}` : '';

  const empty: UnifiedData = {
    emails: [],
    incidents: [],
    calendarEvents: [],
    tickets: [],
    generated_at: new Date().toISOString(),
  };

  async function fetchViaFastAPI(): Promise<UnifiedData | null> {
    if (!url) return null;
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();

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

  // Execution order: if forced → direct; else try FastAPI then fallback to direct
  try {
    if (forceDirect) return await fetchViaGoogleDirect();
    const fromApi = await fetchViaFastAPI();
    if (fromApi) return fromApi;
    return await fetchViaGoogleDirect();
  } catch {
    return empty;
  }
}
