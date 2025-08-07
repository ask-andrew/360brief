-- Create the supabase_migrations schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS supabase_migrations;

-- Create the schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version TEXT PRIMARY KEY,
  statements TEXT[],
  name TEXT
);

-- Insert our migration records if they don't exist
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES 
  ('20240803180000', 'initial_schema', ARRAY['-- Initial schema setup']),
  ('20240804180000', 'add_server_timestamp_function', ARRAY['-- Add server timestamp function'])
ON CONFLICT (version) DO NOTHING;

-- Create the user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE OR REPLACE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE OR REPLACE POLICY "Users can insert their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE OR REPLACE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a record for this migration
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20240805160000', 'fix_migration_schema', ARRAY['-- Fixed migration schema and added user_preferences table'])
ON CONFLICT (version) DO NOTHING;
