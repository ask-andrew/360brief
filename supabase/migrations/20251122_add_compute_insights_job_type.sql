-- Migration: Add compute_insights to analytics_jobs job_type constraint
-- Created: 2025-11-22
-- Purpose: Allow compute_insights jobs to be created

-- Drop the old constraint
ALTER TABLE public.analytics_jobs 
  DROP CONSTRAINT IF EXISTS analytics_jobs_job_type_check;

-- Add the new constraint with compute_insights included
ALTER TABLE public.analytics_jobs 
  ADD CONSTRAINT analytics_jobs_job_type_check 
  CHECK (job_type IN ('fetch_messages', 'compute_analytics', 'full_sync', 'compute_insights'));

-- Comment for documentation
COMMENT ON CONSTRAINT analytics_jobs_job_type_check ON public.analytics_jobs 
  IS 'Valid job types: fetch_messages, compute_analytics, full_sync, compute_insights';
