-- Migration: Create digest_schedules table and RLS policies
-- Created at: 2025-08-10

-- 1) Table
CREATE TABLE IF NOT EXISTS public.digest_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','weekdays')),
  time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  include_emails BOOLEAN NOT NULL DEFAULT TRUE,
  include_calendar BOOLEAN NOT NULL DEFAULT TRUE,
  summary_length TEXT NOT NULL DEFAULT 'brief' CHECK (summary_length IN ('brief','detailed','comprehensive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_digest_schedules_user_id ON public.digest_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_digest_schedules_created_at ON public.digest_schedules(created_at DESC);

-- 3) Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_digest_schedules_updated_at ON public.digest_schedules;
CREATE TRIGGER set_digest_schedules_updated_at
BEFORE UPDATE ON public.digest_schedules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) RLS
ALTER TABLE public.digest_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own digest schedules" ON public.digest_schedules;
DROP POLICY IF EXISTS "Users can manage their own digest schedules" ON public.digest_schedules;

CREATE POLICY "Users can view their own digest schedules"
  ON public.digest_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own digest schedules"
  ON public.digest_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digest schedules"
  ON public.digest_schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own digest schedules"
  ON public.digest_schedules FOR DELETE
  USING (auth.uid() = user_id);
