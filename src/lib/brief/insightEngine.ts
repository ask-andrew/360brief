import { UnifiedData, IncidentItem, TicketItem, EmailItem } from '@/types/unified';
import { ExecutiveBrief } from '@/types/brief';

export type InsightResults = {
  highlights: ExecutiveBrief['highlights'];
  blockers: ExecutiveBrief['blockers'];
  nextSteps: ExecutiveBrief['nextSteps'];
  trendLabel?: NonNullable<ExecutiveBrief['metrics']>['trendLabel'];
};

// Basic scoring helpers
function ticketWeight(t: TicketItem): number {
  const prio = { p0: 4, p1: 3, p2: 2, p3: 1 }[t.priority] || 1;
  const status = { blocked: 3, in_progress: 2, open: 1, closed: 0 }[t.status] || 0;
  const dueScore = t.dueDate ? Math.max(0, 5 - daysUntil(t.dueDate)) : 0;
  return prio * 2 + status + dueScore; // simple heuristic
}

function daysUntil(iso?: string): number {
  if (!iso) return 999;
  const d = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

export function computeInsights(unified: UnifiedData): InsightResults {
  const highlights: InsightResults['highlights'] = [];
  const blockers: InsightResults['blockers'] = [];
  const nextSteps: InsightResults['nextSteps'] = [];

  const latestEmail = pickLatestEmail(unified.emails || []);
  const latestEmailUrl = latestEmail ? buildMessageUrl(latestEmail.id) : undefined;

  // Incidents become top highlights and potential blockers
  const incidents = (unified.incidents || []) as IncidentItem[];
  incidents
    .sort((a, b) => (a.severity > b.severity ? -1 : 1))
    .slice(0, 3)
    .forEach((inc) => {
      highlights.push({
        title: `Incident: ${inc.title}`,
        summary: [
          `${inc.severity.toUpperCase()} incident`,
          inc.arrAtRisk ? `ARR at risk ~$${inc.arrAtRisk}` : undefined,
          inc.affectedUsers ? `${inc.affectedUsers} users` : undefined,
          inc.startedAt ? `Started ${new Date(inc.startedAt).toLocaleString()}` : undefined,
          inc.description,
        ]
          .filter(Boolean)
          .join(' | '),
        ...(latestEmailUrl
          ? { cta: { label: 'Open latest message', url: latestEmailUrl } }
          : {}),
        refs: latestEmail ? { emailIds: [latestEmail.id] } : undefined,
      });
      if (inc.severity === 'sev1' || inc.severity === 'sev2') {
        blockers.push({
          title: `Resolve ${inc.title}`,
          owner: 'Incident Commander',
          nextStep: `Active ${inc.severity.toUpperCase()} incident impacting customers.`,
        });
        nextSteps.push({
          title: `Coordinate fix: ${inc.title}`,
          assignee: 'Incident Commander',
          due: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        });
      }
    });

  // Tickets drive actionable next steps
  const tickets = (unified.tickets || []) as TicketItem[];
  tickets
    .filter((t) => t.status !== 'closed')
    .sort((a, b) => ticketWeight(b) - ticketWeight(a))
    .slice(0, 5)
    .forEach((t) => {
      nextSteps.push({
        title: `${t.title}`,
        assignee: t.owner || 'Unassigned',
        due: t.dueDate,
      });
      if (t.status === 'blocked') {
        blockers.push({
          title: `Unblock: ${t.title}`,
          owner: t.owner || 'Unassigned',
          nextStep: t.description || 'Requires attention to proceed.',
        });
      }
    });

  // Trend label: naive based on incident count mapped to allowed labels
  const incidentCount = incidents.length;
  const trendLabel: InsightResults['trendLabel'] =
    incidentCount >= 2 ? 'Higher than usual' : incidentCount === 1 ? 'Normal' : 'Lower than usual';

  return { highlights, blockers, nextSteps, trendLabel };
}

// Helpers for action links
function pickLatestEmail(emails: EmailItem[]): EmailItem | undefined {
  if (!emails.length) return undefined;
  return [...emails].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

function buildMessageUrl(id: string): string {
  // Generic internal route for future message viewer. Can be replaced with provider deep links later.
  return `/messages/${id}`;
}
