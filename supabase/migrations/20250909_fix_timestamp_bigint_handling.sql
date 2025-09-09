-- Fix timestamp handling for production deployment
-- Production database has bigint expires_at, application now correctly handles this
-- This migration ensures consistent timestamp handling across all environments

-- Create a comment to document the fix
COMMENT ON COLUMN public.user_tokens.expires_at IS 
  'OAuth token expiry as Unix timestamp (seconds). Application converts Google OAuth millisecond timestamps to Unix seconds for storage.';

-- Ensure we handle any existing invalid data
UPDATE public.user_tokens 
SET expires_at = NULL 
WHERE expires_at IS NOT NULL 
  AND (expires_at < 946684800 OR expires_at > 4102444800); -- Invalid timestamp range

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