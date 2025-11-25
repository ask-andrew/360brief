/**
 * useAnalyticsWithJobs Hook
 * 
 * Integrates background jobs with analytics data fetching
 * - Creates a background job for data fetching
 * - Polls for job completion
 * - Returns cached analytics when ready
 * - Shows progress during processing
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AnalyticsJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  job_type: string;
  progress: number;
  total: number;
  metadata?: Record<string, unknown>;
  error?: string;
  created_at: string;
  completed_at?: string;
}

interface AnalyticsData {
  totalCount: number;
  // Add other analytics fields as needed
  [key: string]: unknown;
}

interface UseAnalyticsWithJobsOptions {
  daysBack?: number;
  enabled?: boolean;
  useDemo?: boolean;
}

interface UseAnalyticsWithJobsReturn {
  data: AnalyticsData | null;
  job: AnalyticsJob | null;
  isLoading: boolean;
  isProcessing: boolean;
  isError: boolean;
  error: Error | null;
  progress: number;
  refetch: () => void;
  createJob: () => void;
}

import { useAuth } from '@/contexts/AuthContext';

// ... (keep existing interfaces)

export function useAnalyticsWithJobs(
  options: UseAnalyticsWithJobsOptions = {}
): UseAnalyticsWithJobsReturn {
  const { daysBack = 7, enabled = true, useDemo = false } = options;
  const { session, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const shouldEnable = enabled && !!session && !authLoading;

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/analytics/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_type: 'fetch_messages',
          metadata: { 
            days_back: daysBack,
            max_messages: 1000 // Increased for better batch processing
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create job');
      }

      const result = await response.json();
      return result.job as AnalyticsJob;
    },
    onSuccess: (job) => {
      console.log('✅ Job created:', job.id, 'Status:', job.status);
      setCurrentJobId(job.id);
    },
  });

  // Poll for existing or latest job
  const { data: latestJob } = useQuery({
    queryKey: ['analytics-jobs', 'latest'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/jobs?limit=1');
      if (!response.ok) return null;
      
      const result = await response.json();
      if (result.jobs && result.jobs.length > 0) {
        return result.jobs[0] as AnalyticsJob;
      }
      return null;
    },
    enabled: enabled && !useDemo && !currentJobId,
    refetchOnMount: true,
  });

  // Fetch analytics data when job completes
  const { data: fetchedData, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics-data', daysBack],
    queryFn: async () => {
      // Try to get analytics from cached job data first
      const response = await fetch(`/api/analytics/from-job?daysBack=${daysBack}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics from job');
      }
      return response.json();
    },
    enabled: false, // Only fetch manually when job completes
  });

  // Set job ID from latest job if we don't have one
  useEffect(() => {
    if (latestJob && !currentJobId) {
      console.log('📋 Found latest job:', latestJob.id, 'Status:', latestJob.status);
      setCurrentJobId(latestJob.id);
      
      // If the latest job is already completed, fetch analytics immediately
      if (latestJob.status === 'completed' && !analyticsData) {
        console.log('🎉 Latest job already completed, fetching analytics...');
        refetchAnalytics().then((result) => {
          if (result.data) {
            console.log('📊 Analytics data fetched:', Object.keys(result.data));
            setAnalyticsData(result.data);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestJob, currentJobId, analyticsData]);

  // Poll current job status
  const { data: job } = useQuery({
    queryKey: ['analytics-job', currentJobId],
    queryFn: async () => {
      if (!currentJobId) return null;
      const response = await fetch(`/api/analytics/jobs/${currentJobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }
      return response.json();
    },
    enabled: shouldEnable && !!currentJobId && !useDemo,
    refetchInterval: (query) => {
      const data = query.state.data as AnalyticsJob | null;
      // Stop polling if completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
  });


  // Auto-fetch analytics when job completes
  useEffect(() => {
    if (job?.status === 'completed' && !analyticsData) {
      console.log('🎉 Job completed, fetching analytics data from cache...');
      
      // When job is completed, fetch analytics from the cached data
      refetchAnalytics().then((result) => {
        if (result.data) {
          console.log('📊 Analytics data fetched from cache:', Object.keys(result.data));
          setAnalyticsData(result.data);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status, analyticsData]);

  // Update analytics data when fetched
  useEffect(() => {
    if (fetchedData) {
      setAnalyticsData(fetchedData);
    }
  }, [fetchedData]);

  // Determine loading states
  const isLoading = createJobMutation.isPending || (enabled && !useDemo && !job && !analyticsData);
  const isProcessing = job?.status === 'pending' || job?.status === 'processing';
  const isError = createJobMutation.isError || job?.status === 'failed';
  const error = createJobMutation.error || (job?.status === 'failed' ? new Error(job.error) : null);
  const progress = job && job.total > 0 ? Math.floor((job.progress / job.total) * 100) : 0;

  // Debug logging
  useEffect(() => {
    console.log('🔍 Hook State:', {
      hasJob: !!job,
      jobStatus: job?.status,
      isProcessing,
      isLoading,
      hasData: !!analyticsData,
      progress
    });
  }, [job, isProcessing, isLoading, analyticsData, progress]);

  // Auto-create job if none exists (with timeout protection)
  useEffect(() => {
    if (enabled && !useDemo && !currentJobId && !latestJob && !createJobMutation.isPending) {
      console.log('🆕 No existing job found, creating new one...');
      createJobMutation.mutate();
    }
  }, [enabled, useDemo, currentJobId, latestJob, createJobMutation]);

  // Fallback: If job is stuck in processing for too long, fetch analytics directly
  useEffect(() => {
    if (!job || !enabled || useDemo) return;

    const jobAge = job.created_at ? Date.now() - new Date(job.created_at).getTime() : 0;
    const isStuck = (job.status === 'pending' || job.status === 'processing') && jobAge > 60000; // 60 seconds

    if (isStuck && !analyticsData) {
      console.warn('⚠️ Job appears stuck, falling back to direct analytics fetch...');
      
      // Fetch analytics directly as fallback
      fetch(`/api/analytics?daysBack=${daysBack}`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ Fallback analytics data fetched');
          setAnalyticsData(data);
        })
        .catch(err => {
          console.error('❌ Fallback fetch failed:', err);
        });
    }
  }, [job, enabled, useDemo, analyticsData, daysBack]);

  return {
    data: analyticsData,
    job: job || null,
    isLoading,
    isProcessing,
    isError,
    error,
    progress,
    refetch: () => {
      setCurrentJobId(null);
      setAnalyticsData(null);
      queryClient.invalidateQueries({ queryKey: ['analytics-jobs'] });
      createJobMutation.mutate();
    },
    createJob: () => createJobMutation.mutate(),
  };
}
