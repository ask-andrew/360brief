-- Final fix: Convert timestamp columns to bigint for Unix seconds storage
-- This aligns with OAuth provider standards and application logic

-- Convert user_tokens timestamp columns to bigint (Unix seconds)
DO $$
BEGIN
  -- Fix expires_at column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_tokens' 
    AND column_name = 'expires_at'
    AND data_type != 'bigint'
  ) THEN
    -- Convert TIMESTAMPTZ to bigint (Unix seconds)
    ALTER TABLE public.user_tokens 
    ALTER COLUMN expires_at TYPE bigint 
    USING CASE 
      WHEN expires_at IS NOT NULL THEN EXTRACT(EPOCH FROM expires_at)::bigint
      ELSE NULL 
    END;
    
    RAISE NOTICE 'Converted user_tokens.expires_at to bigint (Unix seconds)';
  END IF;
  
  -- Fix updated_at column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_tokens' 
    AND column_name = 'updated_at'
    AND data_type != 'bigint'
  ) THEN
    -- Convert TIMESTAMPTZ to bigint (Unix seconds)
    ALTER TABLE public.user_tokens 
    ALTER COLUMN updated_at TYPE bigint 
    USING CASE 
      WHEN updated_at IS NOT NULL THEN EXTRACT(EPOCH FROM updated_at)::bigint
      ELSE EXTRACT(EPOCH FROM NOW())::bigint
    END;
    
    -- Set default to Unix timestamp
    ALTER TABLE public.user_tokens 
    ALTER COLUMN updated_at SET DEFAULT EXTRACT(EPOCH FROM NOW())::bigint;
    
    RAISE NOTICE 'Converted user_tokens.updated_at to bigint (Unix seconds)';
  END IF;
  
  -- Fix created_at column  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_tokens' 
    AND column_name = 'created_at'
    AND data_type != 'bigint'
  ) THEN
    -- Convert TIMESTAMPTZ to bigint (Unix seconds)
    ALTER TABLE public.user_tokens 
    ALTER COLUMN created_at TYPE bigint 
    USING CASE 
      WHEN created_at IS NOT NULL THEN EXTRACT(EPOCH FROM created_at)::bigint
      ELSE EXTRACT(EPOCH FROM NOW())::bigint
    END;
    
    -- Set default to Unix timestamp
    ALTER TABLE public.user_tokens 
    ALTER COLUMN created_at SET DEFAULT EXTRACT(EPOCH FROM NOW())::bigint;
    
    RAISE NOTICE 'Converted user_tokens.created_at to bigint (Unix seconds)';
  END IF;
END $$;

-- Update trigger to use Unix timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = EXTRACT(EPOCH FROM NOW())::bigint;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Recreate trigger
DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON public.user_tokens;

CREATE TRIGGER update_user_tokens_updated_at 
    BEFORE UPDATE ON public.user_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update column comments to document the Unix timestamp format
COMMENT ON COLUMN public.user_tokens.expires_at IS 
  'OAuth token expiry as Unix timestamp (seconds since epoch). Null means no expiry.';

COMMENT ON COLUMN public.user_tokens.created_at IS 
  'Record creation time as Unix timestamp (seconds since epoch).';

COMMENT ON COLUMN public.user_tokens.updated_at IS 
  'Record last update time as Unix timestamp (seconds since epoch). Auto-updated by trigger.';

-- Clean up any invalid timestamp data (should be rare after conversion)
UPDATE public.user_tokens 
SET expires_at = NULL 
WHERE expires_at IS NOT NULL 
  AND (expires_at < 946684800 OR expires_at > 4102444800); -- Valid range: 2000-2100

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at 
  ON public.user_tokens(expires_at) 
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_tokens_updated_at 
  ON public.user_tokens(updated_at);