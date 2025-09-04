-- Standardize timestamp handling across the application
-- Fix database type mismatches for timestamps

-- First, ensure user_tokens table has consistent timestamp columns
DO $$
BEGIN
  -- Check if expires_at is still bigint and needs to be converted
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_tokens' 
    AND column_name = 'expires_at'
    AND data_type = 'bigint'
  ) THEN
    -- Convert bigint expires_at to TIMESTAMPTZ
    -- Assume bigint values are Unix timestamps in seconds
    ALTER TABLE public.user_tokens 
    ALTER COLUMN expires_at TYPE TIMESTAMPTZ 
    USING CASE 
      WHEN expires_at IS NOT NULL THEN to_timestamp(expires_at)
      ELSE NULL 
    END;
    
    RAISE NOTICE 'Converted user_tokens.expires_at from bigint to TIMESTAMPTZ';
  END IF;
  
  -- Ensure created_at and updated_at are TIMESTAMPTZ
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_tokens' 
    AND column_name = 'created_at'
    AND data_type != 'timestamp with time zone'
  ) THEN
    ALTER TABLE public.user_tokens 
    ALTER COLUMN created_at TYPE TIMESTAMPTZ 
    USING CASE 
      WHEN created_at IS NOT NULL THEN created_at::TIMESTAMPTZ
      ELSE NOW() 
    END;
    
    RAISE NOTICE 'Standardized user_tokens.created_at to TIMESTAMPTZ';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_tokens' 
    AND column_name = 'updated_at'
    AND data_type != 'timestamp with time zone'
  ) THEN
    ALTER TABLE public.user_tokens 
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
    USING CASE 
      WHEN updated_at IS NOT NULL THEN updated_at::TIMESTAMPTZ
      ELSE NOW() 
    END;
    
    RAISE NOTICE 'Standardized user_tokens.updated_at to TIMESTAMPTZ';
  END IF;
END $$;

-- Set proper defaults for timestamp columns
ALTER TABLE public.user_tokens 
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.user_tokens 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add/update trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON public.user_tokens;

CREATE TRIGGER update_user_tokens_updated_at 
    BEFORE UPDATE ON public.user_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();