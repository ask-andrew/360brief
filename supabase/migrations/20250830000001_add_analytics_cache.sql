-- Migration: Add analytics cache table for Gmail and other data
-- Created at: 2025-08-30

-- Analytics cache table (per-user, per-provider cached analytics data)
CREATE TABLE IF NOT EXISTS public.user_analytics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'calendar', 'slack', 'notion')),
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own analytics cache"
  ON public.user_analytics_cache FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_analytics_cache_user_provider 
  ON public.user_analytics_cache(user_id, provider);

CREATE INDEX IF NOT EXISTS idx_user_analytics_cache_expires
  ON public.user_analytics_cache(expires_at);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.user_analytics_cache 
  WHERE expires_at < NOW();
END;
$$;