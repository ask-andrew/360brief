import { UnifiedData } from '@/types/unified';

const now = new Date();
const today = now.toISOString();
const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

export const unifiedSample: UnifiedData = {
  emails: [
    {
      id: 'em1',
      subject: 'Renewal risk: TechFlow outage feedback',
      body: 'Customers are considering churn unless we provide SLA credits and clear RCA.',
      from: 'csm@360brief.com',
      to: ['exec@360brief.com'],
      date: today,
    },
  ],
  incidents: [
    {
      id: 'inc1',
      title: 'TechFlow Production Outage',
      severity: 'sev1',
      startedAt: sixHoursAgo,
      endedAt: today,
      affectedUsers: 15000,
      arrAtRisk: 2400000,
      description: 'Cascading DB failures with replication lag and failover issues',
    },
  ],
  calendarEvents: [
    { id: 'ev1', title: '09:00 Emergency Response Call', start: today, end: today, attendees: ['ops@360brief.com'] },
    { id: 'ev2', title: '10:00 Root Cause Review', start: today, end: today, attendees: ['eng@360brief.com'] },
    { id: 'ev3', title: '11:00 Retention Strategy', start: today, end: today, attendees: ['csm@360brief.com'] },
  ],
  tickets: [
    { id: 't1', title: 'DB failover guardrails', status: 'in_progress', priority: 'p0', description: 'Automate failover, add circuit breakers' },
    { id: 't2', title: 'Customer comms + credits', status: 'open', priority: 'p1', description: 'Daily updates; credits where warranted' },
    { id: 't3', title: 'Monitoring gaps', status: 'open', priority: 'p2', description: 'Close metrics gaps, alert tuning' },
  ],
  generated_at: today,
};
