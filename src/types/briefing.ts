export type Priority = 'high' | 'medium' | 'low';
export type Status = 'unresolved' | 'in_progress' | 'resolved';

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: Priority;
  owner?: string;
  status?: 'not_started' | 'in_progress' | 'pending_review' | 'completed';
  related_to?: string;
  estimated_time?: string;
  dependencies?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Theme {
  title: string;
  description: string;
  impact?: string;
  additionalInfo?: string;
  metrics?: Metric[];
}

export interface Metric {
  name: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  change?: string | number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  type?: 'meeting' | 'deadline' | 'milestone' | 'other';
  attendees?: string[];
  location?: string;
}

export interface Blocker {
  id: string;
  title: string;
  owner?: string;
  status: Status;
  impact?: 'critical' | 'high' | 'medium' | 'low';
  description?: string;
  first_reported?: string;
  escalation_path?: string[];
  potential_solutions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Kudo {
  id: string;
  message: string;
  from: string;
  date: string;
  category?: string;
  impact?: string;
  related_to?: string;
  created_at?: string;
}

export interface ProjectUpdate {
  id: string;
  name: string;
  status: 'on_track' | 'at_risk' | 'behind';
  progress: number;
  last_updated: string;
  owner: string;
  description?: string;
  key_achievements?: string[];
  risks?: string[];
  next_milestone?: string;
  milestone_date?: string;
  budget_status?: string;
  team_morale?: 'high' | 'medium' | 'low';
  dependencies?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface BriefingData {
  key_themes?: Array<string | Theme>;
  action_items?: ActionItem[];
  blockers?: Blocker[];
  kudos?: Kudo[];
  project_updates?: ProjectUpdate[];
  metrics?: Metric[];
  upcoming_events?: Event[];
  generated_at?: string;
  time_range?: {
    start: string;
    end: string;
  };
}

export type CommunicationStyle = 'mission-brief' | 'management-consulting' | 'startup-velocity' | 'newsletter';

export interface BriefingDigestProps {
  isDetailed?: boolean;
  onToggleDetail?: () => void;
  style?: CommunicationStyle;
  className?: string;
}
