/**
 * Progress Tracker Component
 * 
 * Displays real-time progress for analytics background jobs
 * Polls job status every 2 seconds and shows:
 * - Progress bar
 * - Current step description
 * - Message count (X/Y messages)
 * - Status indicators
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface ProgressTrackerProps {
  jobId: string;
  onComplete?: (jobId: string) => void;
  onError?: (error: string) => void;
}

interface JobProgress {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  job_type: string;
  progress: number;
  total: number;
  metadata?: {
    current_step?: string;
    [key: string]: any;
  };
  error?: string;
  created_at: string;
  completed_at?: string;
}

export function ProgressTracker({ jobId, onComplete, onError }: ProgressTrackerProps) {
  const [startTime] = useState(Date.now());

  // Poll job status every 2 seconds
  const { data, error, isLoading } = useQuery({
    queryKey: ['analytics-job', jobId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }
      const result = await response.json();
      return result.job as JobProgress;
    },
    refetchInterval: (data) => {
      // Stop polling when job is complete or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    enabled: !!jobId,
  });

  // Handle completion
  useEffect(() => {
    if (data?.status === 'completed') {
      onComplete?.(jobId);
    } else if (data?.status === 'failed') {
      onError?.(data.error || 'Job failed');
    }
  }, [data?.status, jobId, onComplete, onError, data?.error]);

  if (isLoading || !data) {
    return (
      <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Initializing...
          </span>
        </div>
      </div>
    );
  }

  const percentage = data.total > 0 ? Math.floor((data.progress / data.total) * 100) : 0;
  const currentStep = data.metadata?.current_step || 'Processing...';
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  const estimatedTotal = data.progress > 0 && percentage > 0
    ? Math.floor((elapsedSeconds / percentage) * 100)
    : null;
  const estimatedRemaining = estimatedTotal ? estimatedTotal - elapsedSeconds : null;

  // Status colors and labels
  const statusConfig = {
    pending: { color: 'blue', label: 'Pending', icon: '⏳' },
    processing: { color: 'blue', label: 'Processing', icon: '⚙️' },
    completed: { color: 'green', label: 'Completed', icon: '✅' },
    failed: { color: 'red', label: 'Failed', icon: '❌' },
  };

  const config = statusConfig[data.status];

  if (data.status === 'completed') {
    return (
      <div className="space-y-4 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                {config.label}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Processed {data.total} messages in {elapsedSeconds}s
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data.status === 'failed') {
    return (
      <div className="space-y-4 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              {config.label}
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              {data.error || 'An error occurred'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {config.label}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Job ID: {jobId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Status Details */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
          <span className="font-medium">{currentStep}</span>
        </div>
        <span className="text-gray-500 dark:text-gray-400">
          {data.progress.toLocaleString()} / {data.total.toLocaleString()}
        </span>
      </div>

      {/* Time Estimate */}
      {estimatedRemaining !== null && estimatedRemaining > 0 && data.status === 'processing' && (
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Estimated time remaining: {Math.floor(estimatedRemaining / 60)}m {estimatedRemaining % 60}s
          </span>
        </div>
      )}

      {/* Pulse indicator */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
        <span>Live updates every 2 seconds</span>
      </div>
    </div>
  );
}

// Add shimmer animation to tailwind config or inline style
const  shimmerAnimation = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;
