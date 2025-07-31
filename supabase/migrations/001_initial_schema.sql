-- 360Brief Database Schema
-- Initial migration for user tokens and preferences

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE provider_type AS ENUM ('google', 'microsoft', 'slack', 'asana', 'notion');
CREATE TYPE digest_frequency AS ENUM ('daily', 'weekly', 'weekdays', 'custom');
CREATE TYPE digest_style AS ENUM ('management', 'executive', 'minimal', 'detailed');
CREATE TYPE preferred_format AS ENUM ('email', 'web', 'both');

-- User tokens table for OAuth refresh tokens
CREATE TABLE user_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    provider provider_type NOT NULL,
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    expires_at BIGINT, -- Unix timestamp for token expiration
    scopes TEXT[], -- Array of OAuth scopes
    token_metadata JSONB DEFAULT '{}', -- Additional token metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one token per user per provider
    UNIQUE(user_id, provider)
);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    timezone TEXT DEFAULT 'UTC',
    digest_frequency digest_frequency DEFAULT 'daily',
    digest_time TEXT DEFAULT '07:00', -- HH:MM format
    digest_style digest_style DEFAULT 'executive',
    preferred_format preferred_format DEFAULT 'email',
    email_notifications BOOLEAN DEFAULT true,
    priority_keywords TEXT[] DEFAULT '{}',
    key_contacts TEXT[] DEFAULT '{}', -- Array of email addresses
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_provider ON user_tokens(provider);
CREATE INDEX idx_user_tokens_expires_at ON user_tokens(expires_at);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_user_tokens_updated_at 
    BEFORE UPDATE ON user_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_tokens
CREATE POLICY "Users can view their own tokens" ON user_tokens
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own tokens" ON user_tokens
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own tokens" ON user_tokens
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own tokens" ON user_tokens
    FOR DELETE USING (user_id = auth.uid()::text);

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (user_id = auth.uid()::text);

-- Comments for documentation
COMMENT ON TABLE user_tokens IS 'Stores OAuth refresh tokens for external service integrations';
COMMENT ON TABLE user_preferences IS 'Stores user preferences for digest generation and delivery';
COMMENT ON COLUMN user_tokens.expires_at IS 'Unix timestamp when the access token expires';
COMMENT ON COLUMN user_tokens.scopes IS 'Array of OAuth scopes granted for this token';
COMMENT ON COLUMN user_tokens.token_metadata IS 'Additional metadata about the token (e.g., granted permissions)';
COMMENT ON COLUMN user_preferences.digest_time IS 'Time of day to send digest in HH:MM format';
COMMENT ON COLUMN user_preferences.priority_keywords IS 'Keywords that increase message priority in digest';
COMMENT ON COLUMN user_preferences.key_contacts IS 'Email addresses of important contacts to highlight in digest';
