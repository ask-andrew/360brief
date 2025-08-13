-- Create sender_engagement_metrics table
CREATE TABLE IF NOT EXISTS public.sender_engagement_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  client_name TEXT,
  total_received INTEGER NOT NULL DEFAULT 0,
  total_opened INTEGER NOT NULL DEFAULT 0,
  total_replied INTEGER NOT NULL DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sender_email)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sender_metrics_user_id ON public.sender_engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_sender_metrics_sender_email ON public.sender_engagement_metrics(sender_email);
CREATE INDEX IF NOT EXISTS idx_sender_metrics_last_interaction ON public.sender_engagement_metrics(last_interaction);

-- Enable RLS
ALTER TABLE public.sender_engagement_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for sender_engagement_metrics
CREATE POLICY "Users can view their own sender metrics"
  ON public.sender_engagement_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sender metrics"
  ON public.sender_engagement_metrics FOR ALL
  USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_sender_metrics_updated_at
BEFORE UPDATE ON public.sender_engagement_etrics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
