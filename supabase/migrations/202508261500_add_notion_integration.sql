-- Migration: Add Notion OAuth integration
-- Created at: 2025-08-26

-- 1) Table for Notion connections
CREATE TABLE IF NOT EXISTS public.notion_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  bot_id TEXT NOT NULL,
  workspace_name TEXT,
  workspace_icon TEXT,
  owner_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE(user_id, bot_id)
);

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_notion_connections_user_id ON public.notion_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_notion_connections_bot_id ON public.notion_connections(bot_id);

-- 3) Trigger to update updated_at
CREATE OR REPLACE TRIGGER set_notion_connections_updated_at
BEFORE UPDATE ON public.notion_connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) RLS
ALTER TABLE public.notion_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Notion connections"
  ON public.notion_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own Notion connections"
  ON public.notion_connections FOR ALL
  USING (auth.uid() = user_id);

-- 5) Add Notion to the integrations enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'integration_type' 
    AND EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'integration_type'::regtype)
  ) THEN
    CREATE TYPE public.integration_type AS ENUM ('google', 'microsoft', 'slack', 'notion');
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'integration_type'::regtype 
    AND enumlabel = 'notion'
  ) THEN
    ALTER TYPE public.integration_type ADD VALUE 'notion';
  END IF;
END $$;
