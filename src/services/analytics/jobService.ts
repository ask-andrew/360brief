/**
 * Analytics Job Service
 * Manages background jobs for analytics processing
 * 
 * @module services/analytics/jobService
 */

import { createClient } from '@supabase/supabase-js';
import type {
  AnalyticsJob,
  CreateJobRequest,
  UpdateJobRequest,
  JobProgressUpdate,
  JobStatus,
  JobType,
} from '@/types/analytics-jobs';
import { DB_TABLES, JobStatusHelpers } from '@/types/analytics-jobs';

/**
 * Analytics Job Service
 * Handles CRUD operations for analytics background jobs
 */
export class AnalyticsJobService {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseClient?: ReturnType<typeof createClient>) {
    // Use provided client or create service role client
    this.supabase = supabaseClient ?? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Create a new analytics job
   * @param request Job creation parameters
   * @returns Created job
   */
  async createJob(request: CreateJobRequest): Promise<AnalyticsJob> {
    const jobData = {
      user_id: request.user_id,
      job_type: request.job_type,
      status: 'pending' as JobStatus,
      progress: 0,
      total: 0,
      metadata: request.metadata || {},
      retry_count: 0,
      max_retries: 3,
    };

    const { data, error } = await this.supabase
      .from(DB_TABLES.ANALYTICS_JOBS)
      .insert(jobData)
      .select()
      .single();

    if (error) {
      console.error('Error creating analytics job:', error);
      throw new Error(`Failed to create job: ${error.message}`);
    }

    console.log(`✅ Created analytics job: ${data.id} (type: ${data.job_type})`);
    return data as AnalyticsJob;
  }

  /**
   * Get job by ID
   * @param jobId Job ID
   * @returns Job or null if not found
   */
  async getJob(jobId: string): Promise<AnalyticsJob | null> {
    const { data, error } = await this.supabase
      .from(DB_TABLES.ANALYTICS_JOBS)
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching job:', error);
      throw new Error(`Failed to fetch job: ${error.message}`);
    }

    return data as AnalyticsJob;
  }

  /**
   * Get jobs for a user
   * @param userId User ID
   * @param options Query options
   * @returns List of jobs
   */
  async getUserJobs(
    userId: string,
    options: {
      status?: JobStatus;
      jobType?: JobType;
      limit?: number;
      orderBy?: 'created_at' | 'updated_at';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<AnalyticsJob[]> {
    let query = this.supabase
      .from(DB_TABLES.ANALYTICS_JOBS)
      .select('*')
      .eq('user_id', userId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.jobType) {
      query = query.eq('job_type', options.jobType);
    }

    const orderColumn = options.orderBy || 'created_at';
    const orderDirection = options.orderDirection || 'desc';
    query = query.order(orderColumn, { ascending: orderDirection === 'asc' });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user jobs:', error);
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    return (data as AnalyticsJob[]) || [];
  }

  /**
   * Update job status and metadata
   * @param jobId Job ID
   * @param update Update data
   * @returns Updated job
   */
  async updateJob(jobId: string, update: UpdateJobRequest): Promise<AnalyticsJob> {
    const updateData: any = {};

    if (update.status !== undefined) {
      updateData.status = update.status;
      
      // Auto-set timestamps based on status
      if (update.status === 'processing' && !update.started_at) {
        updateData.started_at = new Date().toISOString();
      } else if (JobStatusHelpers.isTerminal(update.status) && !update.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (update.progress !== undefined) updateData.progress = update.progress;
    if (update.total !== undefined) updateData.total = update.total;
    if (update.error !== undefined) updateData.error = update.error;
    if (update.error_details !== undefined) updateData.error_details = update.error_details;
    if (update.started_at !== undefined) updateData.started_at = update.started_at;
    if (update.completed_at !== undefined) updateData.completed_at = update.completed_at;

    // Merge metadata if provided
    if (update.metadata) {
      const currentJob = await this.getJob(jobId);
      if (currentJob) {
        updateData.metadata = {
          ...currentJob.metadata,
          ...update.metadata,
        };
      }
    }

    const { data, error } = await this.supabase
      .from(DB_TABLES.ANALYTICS_JOBS)
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      throw new Error(`Failed to update job: ${error.message}`);
    }

    return data as AnalyticsJob;
  }

  /**
   * Update job progress
   * @param update Progress update data
   * @returns Updated job
   */
  async updateProgress(update: JobProgressUpdate): Promise<AnalyticsJob> {
    const updateData: UpdateJobRequest = {
      progress: update.progress,
      total: update.total,
    };

    if (update.currentStep) {
      updateData.metadata = {
        current_step: update.currentStep,
        ...update.metadata,
      };
    } else if (update.metadata) {
      updateData.metadata = update.metadata;
    }

    // Auto-transition to processing if still pending
    const currentJob = await this.getJob(update.jobId);
    if (currentJob?.status === 'pending') {
      updateData.status = 'processing';
    }

    return this.updateJob(update.jobId, updateData);
  }

  /**
   * Mark job as completed
   * @param jobId Job ID
   * @param finalMetadata Optional final metadata
   * @returns Updated job
   */
  async completeJob(jobId: string, finalMetadata?: Record<string, any>): Promise<AnalyticsJob> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    return this.updateJob(jobId, {
      status: 'completed',
      progress: job.total || 100,
      completed_at: new Date().toISOString(),
      metadata: finalMetadata,
    });
  }

  /**
   * Mark job as failed
   * @param jobId Job ID
   * @param error Error message
   * @param errorDetails Detailed error information
   * @returns Updated job
   */
  async failJob(
    jobId: string,
    error: string,
    errorDetails?: Record<string, any>
  ): Promise<AnalyticsJob> {
    return this.updateJob(jobId, {
      status: 'failed',
      error,
      error_details: errorDetails,
      completed_at: new Date().toISOString(),
    });
  }

  /**
   * Retry a failed job
   * @param jobId Job ID
   * @returns Updated job or null if cannot retry
   */
  async retryJob(jobId: string): Promise<AnalyticsJob | null> {
    const job = await this.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (!JobStatusHelpers.canRetry(job)) {
      console.warn(`Cannot retry job ${jobId}: status=${job.status}, retry_count=${job.retry_count}`);
      return null;
    }

    const { data, error } = await this.supabase
      .from(DB_TABLES.ANALYTICS_JOBS)
      .update({
        status: 'pending',
        retry_count: job.retry_count + 1,
        error: null,
        error_details: null,
        started_at: null,
        completed_at: null,
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error retrying job:', error);
      throw new Error(`Failed to retry job: ${error.message}`);
    }

    console.log(`🔄 Retrying job ${jobId} (attempt ${job.retry_count + 1}/${job.max_retries})`);
    return data as AnalyticsJob;
  }

  /**
   * Delete a job
   * @param jobId Job ID
   */
  async deleteJob(jobId: string): Promise<void> {
    const { error } = await this.supabase
      .from(DB_TABLES.ANALYTICS_JOBS)
      .delete()
      .eq('id', jobId);

    if (error) {
      console.error('Error deleting job:', error);
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  /**
   * Get the latest job for a user and type
   * @param userId User ID
   * @param jobType Job type
   * @returns Latest job or null
   */
  async getLatestJob(userId: string, jobType?: JobType): Promise<AnalyticsJob | null> {
    let query = this.supabase
      .from(DB_TABLES.ANALYTICS_JOBS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching latest job:', error);
      throw new Error(`Failed to fetch latest job: ${error.message}`);
    }

    return data && data.length > 0 ? (data[0] as AnalyticsJob) : null;
  }

  /**
   * Check if user has a running job
   * @param userId User ID
   * @param jobType Optional job type filter
   * @returns True if user has a running job
   */
  async hasRunningJob(userId: string, jobType?: JobType): Promise<boolean> {
    let query = this.supabase
      .from(DB_TABLES.ANALYTICS_JOBS)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['pending', 'processing']);

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error checking running jobs:', error);
      return false;
    }

    return (count || 0) > 0;
  }

  /**
   * Clean up old completed/failed jobs
   * @param olderThanDays Jobs older than this many days
   * @returns Number of deleted jobs
   */
  async cleanupOldJobs(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { count, error } = await this.supabase
      .from(DB_TABLES.ANALYTICS_JOBS)
      .delete({ count: 'exact' })
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error cleaning up old jobs:', error);
      throw new Error(`Failed to cleanup jobs: ${error.message}`);
    }

    console.log(`🧹 Cleaned up ${count || 0} old analytics jobs`);
    return count || 0;
  }
}

/**
 * Create a singleton instance for use across the app
 */
let jobServiceInstance: AnalyticsJobService | null = null;

export function getJobService(): AnalyticsJobService {
  if (!jobServiceInstance) {
    jobServiceInstance = new AnalyticsJobService();
  }
  return jobServiceInstance;
}
