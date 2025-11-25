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
  // Added fields for dashboard
  inbound_count?: number;
  outbound_count?: number;
  avg_response_time_minutes?: number;
  channel_analytics?: {
    by_channel: Array<{ name: string; count: number; percentage: number }>;
    by_time: Array<{ hour: string; count: number }>;
  };
  message_distribution?: {
    by_day: Array<{ date: string; count: number }>;
    by_sender: Array<{ name: string; count: number }>;
  };
  top_projects?: Array<{ name: string; messageCount: number }>;
  priority_messages?: {
    awaiting_my_reply: any[];
    awaiting_their_reply: any[];
  };
  sentiment_analysis?: {
    positive: number;
    neutral: number;
    negative: number;
    overall_trend: 'positive' | 'neutral' | 'negative';
  };
}

export interface AnalyticsRequestParams {
  days_back?: number;
  daysBack?: number;
  use_mock?: boolean;
  useMock?: boolean;
  use_real_data?: boolean;
  useRealData?: boolean;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    parts?: any[];
    body?: { data?: string; size?: number };
  };
  internalDate?: string;
}

export interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
    self?: boolean;
  }>;
  organizer?: {
    email?: string;
    displayName?: string;
    self?: boolean;
  };
  platform: 'Google Calendar';
  isOrganizer: boolean;
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
}
