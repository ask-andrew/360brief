import { UnifiedData } from '@/types/unified';
import { createClient } from '@/lib/supabase/client';

export type FetchUnifiedOptions = {
  startDate?: string; // ISO
  endDate?: string;   // ISO
};

// Minimal TS UnifiedDataService. Tries Supabase (if available), falls back to empty.
export async function fetchUnifiedData(_userId?: string, _opts: FetchUnifiedOptions = {}): Promise<UnifiedData> {
  // Primary source: Python FastAPI unified endpoint
  // Configure via UNIFIED_API_BASE (e.g., http://localhost:8001)
  const base = process.env.UNIFIED_API_BASE || process.env.NEXT_PUBLIC_UNIFIED_API_BASE || 'http://localhost:8001';

  const params = new URLSearchParams();
  if (_opts.startDate) params.set('start', _opts.startDate);
  if (_opts.endDate) params.set('end', _opts.endDate);

  const url = `${base.replace(/\/$/, '')}/api/unified${params.toString() ? `?${params.toString()}` : ''}`;

  const empty: UnifiedData = {
    emails: [],
    incidents: [],
    calendarEvents: [],
    tickets: [],
    generated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!res.ok) return empty;
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
  } catch (e) {
    return empty;
  }
}
