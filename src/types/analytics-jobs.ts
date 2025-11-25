/**
 * Database types for analytics background processing
 * Generated from migration: 20251120_analytics_background_processing.sql
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType = 'fetch_messages' | 'compute_analytics' | 'full_sync' | 'compute_insights';
export type MessageProvider = 'gmail' | 'outlook' | 'slack';

/**
 * Analytics Job
 * Tracks background jobs for fetching and processing analytics data
 */
export interface AnalyticsJob {
  id: string;
  user_id: string;
  status: JobStatus;
  job_type: JobType;
  progress: number;
  total: number;
  metadata: JobMetadata;
  error?: string | null;
  error_details?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  retry_count: number;
  max_retries: number;
}

/**
 * Job Metadata
 * Configuration and parameters for analytics jobs
 */
export interface JobMetadata {
  days_back?: number;
  max_results?: number;
  filters?: Record<string, any>;
  batch_size?: number;
  current_batch?: number;
  next_page_token?: string;
  [key: string]: any;
}

/**
 * Message Cache Entry
 * Cached Gmail/email message to avoid redundant API calls
 */
export interface MessageCacheEntry {
  id: string;
  user_id: string;
  message_id: string;
  thread_id?: string | null;
  provider: MessageProvider;
  raw_data: any; // Full Gmail API response
  processed_data?: ProcessedMessageData | null;
  internal_date?: string | null;
  subject?: string | null;
  from_email?: string | null;
  to_emails?: string[] | null;
  has_attachments: boolean;
  fetched_at: string;
  cache_version: number;
}

/**
 * Processed Message Data
 * Normalized message data ready for analytics
 */
export interface ProcessedMessageData {
  id: string;
  threadId?: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  date: string;
  snippet?: string;
  bodyPreview?: string;
  labels?: string[];
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  sentiment?: SentimentScore;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface SentimentScore {
  score: number; // -1 to 1
  magnitude: number;
  label: 'positive' | 'neutral' | 'negative';
}

/**
 * Analytics Cache Entry
 * Stored computed analytics results
 */
export interface AnalyticsCacheEntry {
  id: string;
  user_id: string;
  cache_key: string;
  data: any; // AnalyticsResponse type
  created_at: string;
  expires_at: string;
  hit_count: number;
}

/**
 * Job Creation Request
 */
export interface CreateJobRequest {
  user_id: string;
  job_type: JobType;
  metadata?: JobMetadata;
}

/**
 * Job Update Request
 */
export interface UpdateJobRequest {
  status?: JobStatus;
  progress?: number;
  total?: number;
  metadata?: Partial<JobMetadata>;
  error?: string;
  error_details?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
}

/**
 * Job Progress Update
 */
export interface JobProgressUpdate {
  jobId: string;
  progress: number;
  total: number;
  currentStep?: string;
  metadata?: Partial<JobMetadata>;
}

/**
 * Database table names
 */
export const DB_TABLES = {
  ANALYTICS_JOBS: 'analytics_jobs',
  MESSAGE_CACHE: 'message_cache',
  ANALYTICS_CACHE: 'analytics_cache',
} as const;

/**
 * Cache key generators
 */
export const CacheKeys = {
  analytics: (userId: string, daysBack: number) => 
    `analytics:${userId}:${daysBack}days`,
  
  messages: (userId: string, provider: MessageProvider = 'gmail') => 
    `messages:${userId}:${provider}`,
    
  aiInsights: (userId: string, daysBack: number) => 
    `ai-insights:${userId}:${daysBack}days`,
} as const;

/**
 * Job status helpers
 */
export const JobStatusHelpers = {
  isComplete: (status: JobStatus) => status === 'completed',
  isFailed: (status: JobStatus) => status === 'failed',
  isRunning: (status: JobStatus) => status === 'processing',
  isPending: (status: JobStatus) => status === 'pending',
  isTerminal: (status: JobStatus) => status === 'completed' || status === 'failed',
  canRetry: (job: AnalyticsJob) => job.status === 'failed' && job.retry_count < job.max_retries,
} as const;
