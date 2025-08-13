-- Fix migration tracking for the initial schema
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) 
VALUES (
  '20230808000000', 
  'initial_schema', 
  ARRAY[
    '-- Initial schema with profiles, digests, and digest_items',
    'CREATE TABLE IF NOT EXISTS public.profiles (...);',
    'CREATE TABLE IF NOT EXISTS public.user_preferences (...);',
    'CREATE TABLE IF NOT EXISTS public.digests (...);',
    'CREATE TABLE IF NOT EXISTS public.digest_items (...);',
    '-- Plus all other statements from the initial migration'
  ]
)
ON CONFLICT (version) DO NOTHING;

-- Add the tokens_and_prefs migration tracking
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) 
VALUES (
  '202508090001', 
  'tokens_and_prefs', 
  ARRAY[
    '-- Migration for tokens and preferences',
    '-- This migration was manually applied',
    '-- Add any relevant statements here'
  ]
)
ON CONFLICT (version) DO NOTHING;

-- Add the digest_schedules migration tracking
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) 
VALUES (
  '202508101530', 
  'add_digest_schedules', 
  ARRAY[
    '-- Migration for digest_schedules table',
    '-- This will be applied in the next step'
  ]
)
ON CONFLICT (version) DO NOTHING;
