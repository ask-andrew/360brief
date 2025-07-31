
export interface Contact {
  email: string;
}

export interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  direction: 'sent' | 'received';
  link: string;
  important: boolean;
}

export interface SlackMessage {
  id: string;
  threadId?: string;
  user: string;
  channel: string;
  channelType: 'im' | 'channel';
  text: string;
  timestamp: Date;
  direction: 'sent' | 'received';
}

export interface Meeting {
  id: string;
  subject: string;
  organizer: string;
  attendees: string[];
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  type: '1:1' | 'Team' | 'External' | 'Internal Project';
}

export interface MockData {
  emails: Email[];
  slackMessages: SlackMessage[];
  meetings: Meeting[];
  contacts: Contact[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface TopContactDataPoint {
    name: string;
    email: number;
    slack: number;
    meetings: number;
}

export interface VolumeDataPoint {
    date: string;
    sent?: number;
    received?: number;
    dm?: number;
    channel?: number;
}

export interface ActivityHour {
    hour: string;
    slack: number;
    emails: number;
}

export interface TopPartnerDataPoint {
    contact: string;
    email: number;
    slack: number;
    meetings: number;
    total: number;
}

export interface MeetingStats {
    avgDuration: MetricValue;
    totalHours: MetricValue;
    meetingsPerWeek: MetricValue;
}

export interface TopicSentimentDataPoint {
    topic: string;
    positive: number;
    negative: number;
    neutral: number;
    total: number;
}

export interface HeatmapDataPoint {
    day: string; // 'Mon', 'Tue', etc.
    hour: number; // 0-23
    value: number; // Average sentiment score (-1 to 1)
    count: number; // Number of emails in this bucket
}

export interface ProcessedData {
  summary: {
    communicationPulse: ChartDataPoint[];
    topContacts: TopContactDataPoint[];
    activityByHour: ActivityHour[];
    meetingStats: MeetingStats;
  };
  email: {
    volume: VolumeDataPoint[];
    unrepliedThreads: { subject: string; from: string; received: string; rawDate: Date; link: string; important: boolean; }[];
    waitingForReply: { subject: string; to: string; sent: string; rawDate: Date; link: string; important: boolean; }[];
  };
  slack: {
    volume: VolumeDataPoint[];
  };
  meetings: {
    timeAllocation: ChartDataPoint[];
  };
  relationships: {
    topPartners: TopPartnerDataPoint[];
    reciprocity: { contact: string; ratio: string }[];
  };
  sentimentAnalysis: {
      sentTopics: TopicSentimentDataPoint[];
      receivedTopics: TopicSentimentDataPoint[];
      sentHeatmap: HeatmapDataPoint[];
      receivedHeatmap: HeatmapDataPoint[];
  }
}

export interface MetricValue {
    value: number;
    trend: string;
    trendDirection: 'up' | 'down';
}

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T;
  sortable?: boolean;
}

export interface SortConfig<T> {
  key: keyof T;
  direction: 'ascending' | 'descending';
}
