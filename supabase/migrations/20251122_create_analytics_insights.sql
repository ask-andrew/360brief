-- Migration: create analytics_insights table
-- Stores computed analytics insights per user
CREATE TABLE IF NOT EXISTS analytics_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  insight_type text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup per user and insight type
CREATE INDEX IF NOT EXISTS idx_analytics_insights_user_type ON analytics_insights(user_id, insight_type);
