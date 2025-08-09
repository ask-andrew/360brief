-- Migration: Add user_tokens table and align user_preferences schema
-- Created at: 2025-08-09

-- 1) user_tokens table (per-user, per-provider OAuth tokens)
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own provider tokens"
  ON public.user_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_tokens_user_provider ON public.user_tokens(user_id, provider);

-- 2) Align user_preferences schema used by API
-- Ensure user_id column exists and expected fields are present. For portability, use IF NOT EXISTS patterns.

-- Add user_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.user_preferences ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add/align columns used by API (timezone, digest_frequency, digest_time, digest_style, preferred_format,
-- email_notifications, priority_keywords, key_contacts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_preferences' AND column_name='timezone') THEN
    ALTER TABLE public.user_preferences ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_preferences' AND column_name='digest_frequency') THEN
    ALTER TABLE public.user_preferences ADD COLUMN digest_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (digest_frequency IN ('daily','weekly','weekdays','custom'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_preferences' AND column_name='digest_time') THEN
    ALTER TABLE public.user_preferences ADD COLUMN digest_time TEXT NOT NULL DEFAULT '07:00';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_preferences' AND column_name='digest_style') THEN
    ALTER TABLE public.user_preferences ADD COLUMN digest_style TEXT NOT NULL DEFAULT 'executive' CHECK (digest_style IN ('mission-brief','management-consulting','startup-velocity','newsletter','executive'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_preferences' AND column_name='preferred_format') THEN
    ALTER TABLE public.user_preferences ADD COLUMN preferred_format TEXT NOT NULL DEFAULT 'email' CHECK (preferred_format IN ('email','slack','audio'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_preferences' AND column_name='email_notifications') THEN
    ALTER TABLE public.user_preferences ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;
  END IF;
  -- Arrays/lists stored as JSONB for flexibility
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_preferences' AND column_name='priority_keywords') THEN
    ALTER TABLE public.user_preferences ADD COLUMN priority_keywords JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_preferences' AND column_name='key_contacts') THEN
    ALTER TABLE public.user_preferences ADD COLUMN key_contacts JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Ensure uniqueness by user_id (single row per user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='user_prefs_user_id_unique'
  ) THEN
    CREATE UNIQUE INDEX user_prefs_user_id_unique ON public.user_preferences(user_id);
  END IF;
END $$;

-- Enable/adjust RLS to use user_id
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
