-- Migration: Add last sync tracking for incremental message fetching
-- This enables us to only fetch NEW messages since last sync, dramatically reducing API calls

-- Add last_sync_at column to user_tokens table
ALTER TABLE user_tokens
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Add last_message_date to track the latest message we've seen
ALTER TABLE user_tokens
ADD COLUMN IF NOT EXISTS last_message_date TIMESTAMPTZ;

-- Add sync statistics for monitoring
ALTER TABLE user_tokens
ADD COLUMN IF NOT EXISTS total_messages_synced INTEGER DEFAULT 0;

-- Create index for efficient querying by sync time
CREATE INDEX IF NOT EXISTS idx_user_tokens_last_sync 
ON user_tokens(user_id, last_sync_at);

-- Add comments for documentation
COMMENT ON COLUMN user_tokens.last_sync_at IS 'Timestamp of last successful Gmail sync';
COMMENT ON COLUMN user_tokens.last_message_date IS 'Date of the most recent message we have synced';
COMMENT ON COLUMN user_tokens.total_messages_synced IS 'Total count of messages synced for this user';

-- Update existing rows to have a baseline
UPDATE user_tokens
SET last_sync_at = NOW() - INTERVAL '7 days',
    total_messages_synced = 0
WHERE last_sync_at IS NULL AND provider = 'google';
