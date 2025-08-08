import { BriefingData, ActionItem, Metric, Event as BriefEvent, Theme } from '@/types/briefing';
import { UnifiedData, IncidentItem, TicketItem, CalendarEventItem } from '@/types/unified';

function iso(date: Date | string): string {
  return typeof date === 'string' ? date : date.toISOString();
}

function durationHours(incident: IncidentItem): number | null {
  if (!incident.endedAt) return null;
  const start = new Date(incident.startedAt).getTime();
  const end = new Date(incident.endedAt).getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60));
}

function pickTimeRange(unified: UnifiedData): { start: string; end: string } | undefined {
  const times: number[] = [];
  unified.emails.forEach(e => times.push(new Date(e.date).getTime()));
  unified.incidents.forEach(i => {
    times.push(new Date(i.startedAt).getTime());
    if (i.endedAt) times.push(new Date(i.endedAt).getTime());
  });
  unified.calendarEvents.forEach(c => {
    times.push(new Date(c.start).getTime());
    times.push(new Date(c.end).getTime());
  });
  unified.tickets.forEach(t => {
    if (t.dueDate) times.push(new Date(t.dueDate).getTime());
  });
  if (!times.length) return undefined;
  const start = new Date(Math.min(...times));
  const end = new Date(Math.max(...times));
  return { start: iso(start), end: iso(end) };
}

function buildMetrics(unified: UnifiedData): Metric[] {
  const arrAtRisk = unified.incidents.reduce((sum, i) => sum + (i.arrAtRisk ?? 0), 0);
  const affectedUsers = unified.incidents.reduce((sum, i) => sum + (i.affectedUsers ?? 0), 0);
  const longestIncident = unified.incidents
    .map(durationHours)
    .filter((h): h is number => h !== null)
    .sort((a, b) => b - a)[0];

  const metrics: Metric[] = [];
  if (arrAtRisk) metrics.push({ name: 'ARR at Risk', value: `$${arrAtRisk.toLocaleString()}` });
  if (typeof longestIncident === 'number') metrics.push({ name: 'Outage Duration', value: `${longestIncident}h` });
  if (affectedUsers) metrics.push({ name: 'Affected Users', value: affectedUsers.toLocaleString() });
  return metrics;
}

function detectThemes(unified: UnifiedData): Theme[] {
  const themes: Theme[] = [];
  if (unified.incidents.length) {
    themes.push({ title: 'Stabilization', description: 'Contain incident blast radius and restore reliability' });
  }
  const highRiskTickets = unified.tickets.filter(t => t.priority === 'p0' || t.priority === 'p1');
  if (highRiskTickets.length) {
    themes.push({ title: 'Prevention', description: 'Close monitoring and infrastructure gaps' });
  }
  const churnSignals = unified.emails.filter(e => /churn|cancel|renewal|risk/i.test(e.subject + ' ' + e.body)).length;
  if (churnSignals) {
    themes.push({ title: 'Retention', description: 'Rebuild confidence with targeted actions' });
  }
  return themes;
}

function mapActionItems(unified: UnifiedData): ActionItem[] {
  const items: ActionItem[] = [];
  unified.tickets
    .filter(t => t.status !== 'closed')
    .slice(0, 5)
    .forEach((t, idx) => {
      items.push({
        id: `T-${t.id}`,
        title: t.title,
        description: t.description,
        due_date: t.dueDate,
        priority: t.priority === 'p0' || t.priority === 'p1' ? 'high' : t.priority === 'p2' ? 'medium' : 'low',
        owner: t.owner,
        status: t.status === 'open' ? 'not_started' : t.status === 'blocked' ? 'pending_review' : 'in_progress',
        related_to: 'ticket',
      });
    });

  unified.incidents.forEach((i) => {
    items.unshift({
      id: `INC-${i.id}`,
      title: `Stabilize: ${i.title}`,
      description: 'Failover + capacity guardrails',
      priority: 'high',
      status: 'in_progress',
      related_to: 'incident',
    });
  });

  return items.slice(0, 8);
}

function mapEvents(unified: UnifiedData): BriefEvent[] {
  return unified.calendarEvents.slice(0, 5).map<BriefEvent>((c) => ({
    id: c.id,
    title: c.title,
    description: c.description ?? '',
    date: c.start,
    type: 'meeting',
    attendees: c.attendees,
    location: c.location,
  }));
}

export function generateBrief(unified: UnifiedData): BriefingData {
  return {
    key_themes: detectThemes(unified),
    action_items: mapActionItems(unified),
    metrics: buildMetrics(unified),
    upcoming_events: mapEvents(unified),
    generated_at: iso(new Date()),
    time_range: pickTimeRange(unified),
  };
}
