-- Fix expires_at column type in user_tokens table
-- The column appears to be bigint instead of TIMESTAMPTZ

-- First, let's see what we're working with and fix it
DO $$
BEGIN
  -- Check if user_tokens table exists and what type expires_at is
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_tokens' 
    AND column_name = 'expires_at'
    AND data_type = 'bigint'
  ) THEN
    -- Convert bigint expires_at to TIMESTAMPTZ
    ALTER TABLE public.user_tokens 
    ALTER COLUMN expires_at TYPE TIMESTAMPTZ 
    USING to_timestamp(expires_at);
    
    RAISE NOTICE 'Converted user_tokens.expires_at from bigint to TIMESTAMPTZ';
    
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_tokens' 
    AND column_name = 'expires_at'
    AND data_type = 'timestamp with time zone'
  ) THEN
    RAISE NOTICE 'user_tokens.expires_at is already TIMESTAMPTZ';
    
  ELSE
    RAISE NOTICE 'user_tokens.expires_at column not found or unexpected type';
  END IF;
END $$;

-- Ensure the column allows NULL values (since refresh can happen without expiry)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_tokens' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.user_tokens 
    ALTER COLUMN expires_at DROP NOT NULL;
  END IF;
END $$;