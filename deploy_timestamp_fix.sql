-- Production deployment script for timestamp fix
-- This script should be run against the production database to ensure consistent timestamp handling

-- Add comment to document the fix
COMMENT ON COLUMN public.user_tokens.expires_at IS 
  'OAuth token expiry as Unix timestamp (seconds). Application converts Google OAuth millisecond timestamps to Unix seconds for storage.';

-- Clean up any invalid timestamp data
UPDATE public.user_tokens 
SET expires_at = NULL 
WHERE expires_at IS NOT NULL 
  AND (expires_at < 946684800 OR expires_at > 4102444800); -- Invalid timestamp range (before 2000 or after 2100)

-- Add index for token expiry queries if not exists
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at 
  ON public.user_tokens(expires_at) 
  WHERE expires_at IS NOT NULL;

-- Add updated_at trigger if not exists for audit trail
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = EXTRACT(EPOCH FROM NOW());
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Drop and recreate trigger to ensure it uses Unix timestamp
DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON public.user_tokens;

CREATE TRIGGER update_user_tokens_updated_at 
    BEFORE UPDATE ON public.user_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_tokens' 
  AND table_schema = 'public'
ORDER BY ordinal_position;