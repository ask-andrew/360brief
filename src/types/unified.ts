import { Timestamped, Owned, TimeRange } from './common';

/**
 * Unified data model for the 360Brief application
 * Centralizes types used across different data sources
 */

export type Severity = 'sev1' | 'sev2' | 'sev3' | 'info';
export type TicketStatus = 'open' | 'in_progress' | 'blocked' | 'closed' | 'resolved';
export type TicketPriority = 'p0' | 'p1' | 'p2' | 'p3';

export interface EmailItem {
  id: string;
  messageId?: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: string; // ISO
  threadId?: string;
  labels?: string[];
  isRead?: boolean;
  isStarred?: boolean;
  hasAttachments?: boolean;
  metadata?: {
    actionItems?: string[];
    meetingReferences?: string[];
    projectContext?: {
      name?: string;
      keywords?: string[];
    };
    insights?: {
      hasActionItems?: boolean;
      hasMeetings?: boolean;
      hasProjectContext?: boolean;
      isPositive?: boolean;
      isUrgent?: boolean;
      category?: string;
      priority?: string;
      sentiment?: string;
      actionItems?: string[];
      keyTopics?: string[];
      responseRequired?: boolean;
    };
    nlpInsights?: {
      sentiment?: {
        type: 'positive' | 'neutral' | 'negative';
        score: number;
        emotionalTones?: string[];
        urgency?: 'low' | 'medium' | 'high';
      };
      intent?: {
        primary: string;
        secondary?: string[];
        complexity?: 'simple' | 'moderate' | 'complex';
        relatedContexts?: string[];
      };
    };
    intelligence?: {
      type?: string;
      projects?: string[];
      blockers?: string[];
      achievements?: string[];
      key_summary?: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface IncidentItem {
  id: string;
  externalId?: string;
  title: string;
  severity: Severity;
  status?: 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'postmortem';
  startedAt: string; // ISO
  endedAt?: string; // ISO
  detectedAt?: string; // ISO
  resolvedAt?: string; // ISO
  affectedUsers?: number;
  affectedServices?: string[];
  arrAtRisk?: number; // dollars
  description?: string;
  rootCause?: string;
  resolution?: string;
  postmortemUrl?: string;
  relatedTickets?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export interface CalendarEventItem {
  id: string;
  externalId?: string;
  title: string;
  description?: string;
  start: string; // ISO
  end: string; // ISO
  isAllDay?: boolean;
  timezone?: string;
  location?: string;
  organizer?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    isOrganizer?: boolean;
    isResource?: boolean;
  }> | string[];
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: 'video' | 'phone' | 'sip' | 'more';
      uri: string;
      label?: string;
      pin?: string;
    }>;
    conferenceSolution?: {
      name: string;
      iconUri?: string;
    };
  };
  recurringEventId?: string;
  originalStartTime?: string; // ISO
  status?: 'confirmed' | 'tentative' | 'cancelled';
  transparency?: 'opaque' | 'transparent';
  visibility?: 'default' | 'public' | 'private';
  iCalUID?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketItem {
  id: string;
  externalId?: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  type?: 'bug' | 'feature' | 'task' | 'improvement' | 'story' | 'epic';
  description?: string;
  dueDate?: string; // ISO
  timeEstimate?: number; // in minutes
  timeSpent?: number; // in minutes
  projectId?: string;
  projectName?: string;
  parentId?: string;
  subtasks?: string[];
  labels?: string[];
  components?: string[];
  fixVersions?: string[];
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
  comments?: Array<{
    id: string;
    author: string;
    body: string;
    created: string; // ISO
    updated?: string; // ISO
  }>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

// Add resolved status for compatibility
export interface TicketStatusStats {
  blocked: number;
  in_progress: number;
  open: number;
  closed: number;
  resolved?: number;
}

export interface UnifiedData {
  emails: EmailItem[];
  incidents: IncidentItem[];
  calendarEvents: CalendarEventItem[];
  tickets: TicketItem[];
  generated_at?: string; // ISO
  enhanced_insights?: any;
}
