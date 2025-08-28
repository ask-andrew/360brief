import { Priority, Status, Metric, TimeRange, Timestamped, Owned } from '../common';

export interface ActionItem extends Timestamped, Owned {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: Priority;
  status?: 'not_started' | 'in_progress' | 'pending_review' | 'completed';
  related_to?: string;
  estimated_time?: string;
  dependencies?: string[];
}

export interface Theme {
  title: string;
  description: string;
  impact?: string;
  additionalInfo?: string;
  metrics?: Metric[];
}

export interface Event extends Timestamped, Owned {
  id: string;
  title: string;
  description: string;
  date: string;
  type?: 'meeting' | 'deadline' | 'milestone' | 'other';
  attendees?: string[];
  location?: string;
}

export interface Blocker extends Timestamped, Owned {
  id: string;
  title: string;
  status: Status;
  impact?: 'critical' | 'high' | 'medium' | 'low';
  description?: string;
  first_reported?: string;
  escalation_path?: string[];
  potential_solutions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Kudo extends Timestamped, Owned {
  id: string;
  message: string;
  from: string;
  date: string;
  category?: string;
  impact?: string;
  related_to?: string;
}

export interface ProjectUpdate extends Timestamped, Owned {
  id: string;
  name: string;
  status: 'on_track' | 'at_risk' | 'behind';
  progress: number;
  last_updated: string;
  description?: string;
  key_achievements?: string[];
  risks?: string[];
  next_milestone?: string;
  milestone_date?: string;
  budget_status?: string;
  team_morale?: 'high' | 'medium' | 'low';
  dependencies?: string[];
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
  time_range?: TimeRange;
}

export type CommunicationStyle = 'concise' | 'detailed' | 'technical' | 'non_technical';

export interface BriefingDigestProps {
  isDetailed?: boolean;
  onToggleDetail?: () => void;
  style?: CommunicationStyle;
  className?: string;
}
