import { TimeRange, Timestamped } from './common';

export interface Metric {
  name: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  change?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending_review' | 'in_progress' | 'completed' | 'blocked' | 'not_started';
  related_to?: string;
  estimated_time?: string;
  dependencies?: string[];
  owner?: string;
}

export interface Blocker {
  id: string;
  title: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'investigating' | 'in_progress' | 'resolved' | 'unresolved';
  affected_teams?: string[];
  resolution_eta?: string;
  impact_description?: string;
  owner?: string;
  impact?: string;
  first_reported?: string;
  escalation_path?: string[];
  potential_solutions?: string[];
}

export interface ProjectUpdate {
  id: string;
  project_name?: string;
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed' | 'behind';
  progress_percentage?: number;
  key_milestones?: string[];
  risks?: string[];
  next_major_milestone?: {
    name: string;
    due_date: string;
  };
  name?: string;
  owner?: string;
  progress?: number;
  last_updated?: string;
  description?: string;
  key_achievements?: string[];
  next_milestone?: string;
  milestone_date?: string;
  budget_status?: string;
  team_morale?: 'high' | 'medium' | 'low';
  dependencies?: string[];
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'meeting' | 'deadline' | 'launch' | 'review' | 'other';
  attendees?: string[] | Array<{
    email: string;
    name?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    isOrganizer?: boolean;
    isResource?: boolean;
  }>;
  location?: string;
  importance?: 'low' | 'medium' | 'high';
}

export interface Theme {
  id?: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  category?: 'product' | 'business' | 'operations' | 'people' | 'market';
  impact?: 'positive' | 'negative' | 'neutral';
  related_items?: string[];
}

export interface Kudo {
  id: string;
  message: string;
  from: string;
  date: string;
  category?: string;
  impact?: string;
  related_to?: string;
}

export interface BriefingData {
  id?: string;
  generated_at: string;
  time_range?: TimeRange;
  key_themes: string[] | Theme[];
  metrics?: Metric[];
  action_items: ActionItem[];
  blockers?: Blocker[];
  project_updates?: ProjectUpdate[];
  upcoming_events?: Event[];
  themes?: Theme[];
  kudos?: Kudo[];
  createdAt?: string;
  updatedAt?: string;
}

export type CommunicationStyle = 'executive' | 'technical' | 'casual' | 'formal';