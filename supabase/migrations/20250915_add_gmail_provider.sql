-- Migration: Add 'gmail' as allowed provider in user_tokens table
-- Created at: 2025-09-15

-- Update provider constraint to include 'gmail'
DO $$
BEGIN
  -- Drop existing constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name LIKE '%provider%'
    AND table_name = 'user_tokens'
  ) THEN
    ALTER TABLE public.user_tokens DROP CONSTRAINT IF EXISTS user_tokens_provider_check;
  END IF;

  -- Add new constraint that includes both google and gmail
  ALTER TABLE public.user_tokens ADD CONSTRAINT user_tokens_provider_check
    CHECK (provider IN ('google', 'gmail'));
END $$;