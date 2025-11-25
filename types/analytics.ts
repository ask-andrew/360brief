export interface AnalyticsResponse {
  message: string;
  total_count: number;
  period_days: number;
  daily_counts: number[];
  top_senders: Array<{
    name: string;
    count: number;
  }>;
  categories: Record<string, number>;
  dataSource: string;
  processing_metadata: {
    source: string;
    processed_at: string;
    message_count: number;
    days_analyzed: number;
    is_real_data: boolean;
  };
  fetch_attempts?: any[];
  totalCount?: number;
  error?: string;
}

export interface AnalyticsRequestParams {
  days_back?: number;
  use_mock?: boolean;
  use_real_data?: boolean;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    parts?: any[];
  };
  internalDate?: string;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string }>;
  organizer?: { email?: string };
  platform: 'Google Calendar';
  isOrganizer?: boolean;
}
