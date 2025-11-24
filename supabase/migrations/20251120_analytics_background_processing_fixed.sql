-- Migration: Add analytics background processing tables
-- Created: 2025-11-20 (FIXED VERSION)
-- Purpose: Enable async job processing and message caching for analytics

-- 1) Analytics Jobs Table
-- Tracks background jobs for fetching and processing analytics data
CREATE TABLE IF NOT EXISTS public.analytics_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Job state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  job_type TEXT NOT NULL CHECK (job_type IN ('fetch_messages', 'compute_analytics', 'full_sync')),
  
  -- Progress tracking
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  total INTEGER DEFAULT 0 CHECK (total >= 0),
  
  -- Job metadata and configuration
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Error information
  error TEXT,
  error_details JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Retry information
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3
);

-- 2) Message Cache Table
-- Caches fetched Gmail messages to avoid redundant API calls
CREATE TABLE IF NOT EXISTS public.message_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Message identifiers
  message_id TEXT NOT NULL,
  thread_id TEXT,
  provider TEXT NOT NULL DEFAULT 'gmail' CHECK (provider IN ('gmail', 'outlook', 'slack')),
  
  -- Message data (two-tier storage)
  raw_data JSONB NOT NULL, -- Full Gmail API response
  processed_data JSONB, -- Processed/normalized data ready for analytics
  
  -- Metadata
  internal_date TIMESTAMPTZ,
  subject TEXT,
  from_email TEXT,
  to_emails TEXT[],
  has_attachments BOOLEAN DEFAULT false,
  
  -- Caching metadata
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  cache_version INTEGER DEFAULT 1,
  
  -- Unique constraint: one message per user per provider
  UNIQUE(user_id, message_id, provider)
);

-- 3) Analytics Cache Table
-- Stores computed analytics results for fast retrieval
CREATE TABLE IF NOT EXISTS public.analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Cache key (e.g., "analytics:7days", "analytics:30days")
  cache_key TEXT NOT NULL,
  
  -- Cached data
  data JSONB NOT NULL,
  
  -- Cache metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  
  -- Unique constraint on user+key
  UNIQUE(user_id, cache_key)
);

-- Indexes for analytics_jobs
CREATE INDEX IF NOT EXISTS idx_analytics_jobs_user_status 
  ON public.analytics_jobs(user_id, status);

CREATE INDEX IF NOT EXISTS idx_analytics_jobs_created 
  ON public.analytics_jobs(created_at DESC);

-- FIXED: Removed NOW() from WHERE clause (not immutable)
CREATE INDEX IF NOT EXISTS idx_analytics_jobs_pending 
  ON public.analytics_jobs(status, created_at DESC) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_analytics_jobs_processing 
  ON public.analytics_jobs(status, created_at DESC) 
  WHERE status = 'processing';

-- Indexes for message_cache
CREATE INDEX IF NOT EXISTS idx_message_cache_user_fetched 
  ON public.message_cache(user_id, fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_cache_user_provider 
  ON public.message_cache(user_id, provider);

CREATE INDEX IF NOT EXISTS idx_message_cache_thread 
  ON public.message_cache(user_id, thread_id) 
  WHERE thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_cache_date 
  ON public.message_cache(user_id, internal_date DESC) 
  WHERE internal_date IS NOT NULL;

-- Indexes for analytics_cache
CREATE INDEX IF NOT EXISTS idx_analytics_cache_user_key 
  ON public.analytics_cache(user_id, cache_key);

-- FIXED: Removed NOW() from WHERE clause - will query with WHERE clause instead
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires 
  ON public.analytics_cache(expires_at);

-- Row Level Security for analytics_jobs
ALTER TABLE public.analytics_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own analytics jobs" ON public.analytics_jobs;
CREATE POLICY "Users can view their own analytics jobs"
  ON public.analytics_jobs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own analytics jobs" ON public.analytics_jobs;
CREATE POLICY "Users can create their own analytics jobs"
  ON public.analytics_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update analytics jobs" ON public.analytics_jobs;
CREATE POLICY "System can update analytics jobs"
  ON public.analytics_jobs FOR UPDATE
  USING (true); -- Allow system updates via service role

-- Row Level Security for message_cache
ALTER TABLE public.message_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own cached messages" ON public.message_cache;
CREATE POLICY "Users can view their own cached messages"
  ON public.message_cache FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage message cache" ON public.message_cache;
CREATE POLICY "System can manage message cache"
  ON public.message_cache FOR ALL
  USING (true) -- Allow system operations via service role
  WITH CHECK (true);

-- Row Level Security for analytics_cache
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own analytics cache" ON public.analytics_cache;
CREATE POLICY "Users can view their own analytics cache"
  ON public.analytics_cache FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage analytics cache" ON public.analytics_cache;
CREATE POLICY "System can manage analytics cache"
  ON public.analytics_cache FOR ALL
  USING (true) -- Allow system operations via service role
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for analytics_jobs
DROP TRIGGER IF EXISTS set_analytics_jobs_updated_at ON public.analytics_jobs;
CREATE TRIGGER set_analytics_jobs_updated_at
  BEFORE UPDATE ON public.analytics_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old completed jobs (retention: 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.analytics_jobs
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.analytics_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old message cache (retention: 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_message_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.message_cache
  WHERE fetched_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.analytics_jobs IS 'Background jobs for fetching and processing analytics data';
COMMENT ON TABLE public.message_cache IS 'Cached Gmail messages to reduce API calls';
COMMENT ON TABLE public.analytics_cache IS 'Computed analytics results for fast retrieval';

COMMENT ON COLUMN public.analytics_jobs.metadata IS 'JSON metadata including days_back, maxResults, filters, etc.';
COMMENT ON COLUMN public.message_cache.raw_data IS 'Full Gmail API response for reference';
COMMENT ON COLUMN public.message_cache.processed_data IS 'Normalized data ready for analytics computation';
COMMENT ON COLUMN public.analytics_cache.cache_key IS 'Unique cache key like "analytics:7days" or "analytics:30days"';
