// Unified data model feeding the Brief generator
// Keep minimal and extend incrementally.

export type Severity = 'sev1' | 'sev2' | 'sev3' | 'info';
export type TicketStatus = 'open' | 'in_progress' | 'blocked' | 'closed';
export type TicketPriority = 'p0' | 'p1' | 'p2' | 'p3';

export interface EmailItem {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: string; // ISO
}

export interface IncidentItem {
  id: string;
  title: string;
  severity: Severity;
  startedAt: string; // ISO
  endedAt?: string; // ISO
  affectedUsers?: number;
  arrAtRisk?: number; // dollars
  description?: string;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO
  end: string; // ISO
  attendees?: string[];
  location?: string;
}

export interface TicketItem {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  dueDate?: string; // ISO
  owner?: string;
  description?: string;
}

export interface UnifiedData {
  emails: EmailItem[];
  incidents: IncidentItem[];
  calendarEvents: CalendarEventItem[];
  tickets: TicketItem[];
  generated_at?: string; // ISO
}
