/**
 * Common types used across the application
 */

export type Priority = 'high' | 'medium' | 'low';
export type Status = 'unresolved' | 'in_progress' | 'resolved';

export interface Metric {
  name: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  change?: string | number;
}

export interface TimeRange {
  start: string; // ISO date string
  end: string;   // ISO date string
}

// Common interface for items with timestamps
export interface Timestamped {
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Common interface for items with an owner
export interface Owned {
  owner_id?: string;
  owner_name?: string;
  owner_email?: string;
}

// Common interface for paginated responses
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
