-- Migration: Level 10 Analytics Foundation - 4-Layer Architecture
-- Created: 2025-11-24
-- Purpose: Implement the foundation for advanced analytics metrics
-- Architecture: Raw → Processed → Enriched → Metrics

-- ============================================================================
-- LAYER 2: PROCESSED DATA (Normalized)
-- ============================================================================

-- Email Threads Table
-- Reconstructed email threads using Message-ID, In-Reply-To, References
CREATE TABLE IF NOT EXISTS public.email_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Thread identification
  thread_id TEXT NOT NULL, -- Gmail thread ID or generated thread ID
  root_message_id TEXT, -- First message in thread
  
  -- Thread metadata
  subject TEXT,
  participant_emails TEXT[], -- All participants in thread
  message_count INTEGER DEFAULT 0,
  
  -- Thread state
  last_message_date TIMESTAMPTZ,
  last_sender_email TEXT,
  is_user_last_sender BOOLEAN DEFAULT false, -- Did user send last message?
  
  -- Thread classification
  is_abandoned BOOLEAN DEFAULT false, -- No reply in > 7 days
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, thread_id)
);

-- Thread Messages Junction Table
-- Links messages to threads
CREATE TABLE IF NOT EXISTS public.thread_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.email_threads(id) ON DELETE CASCADE,
  message_cache_id UUID NOT NULL REFERENCES public.message_cache(id) ON DELETE CASCADE,
  
  -- Position in thread
  sequence_number INTEGER NOT NULL,
  
  -- Response time tracking
  response_time_hours DECIMAL, -- Time since previous message
  is_working_hours BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(thread_id, message_cache_id)
);

-- Participants Table (Unified Contact Records)
-- Normalizes email addresses to single identities
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Canonical identity
  canonical_email TEXT NOT NULL, -- Primary email address
  display_name TEXT,
  
  -- All known email addresses for this person
  email_addresses TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Contact metadata
  domain TEXT, -- Company domain
  is_internal BOOLEAN DEFAULT false, -- Same domain as user
  
  -- Relationship classification
  relationship_type TEXT, -- 'direct_report', 'manager', 'client', 'vendor', 'team', 'other'
  importance_weight DECIMAL DEFAULT 1.0, -- For weighted calculations
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, canonical_email)
);

-- Events Timeline Table
-- Unified chronological stream of all communication events
CREATE TABLE IF NOT EXISTS public.events_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Event identification
  event_type TEXT NOT NULL CHECK (event_type IN ('email_sent', 'email_received', 'meeting', 'slack_message')),
  event_date TIMESTAMPTZ NOT NULL,
  
  -- References to source data
  message_cache_id UUID REFERENCES public.message_cache(id) ON DELETE CASCADE,
  -- calendar_event_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE, -- Future
  
  -- Event metadata
  participants TEXT[], -- All people involved
  subject TEXT,
  duration_minutes INTEGER, -- For meetings
  
  -- Context classification (for Context Switch Tax)
  context_category TEXT, -- 'client_work', 'team_mgmt', 'product', 'operations', 'other'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships Table
-- Contact-to-contact mapping for network analysis
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- The two participants in the relationship
  participant_a_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  participant_b_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  
  -- Relationship strength
  interaction_count INTEGER DEFAULT 0,
  last_interaction_date TIMESTAMPTZ,
  
  -- User's role in relationship
  user_is_connector BOOLEAN DEFAULT false, -- User introduced them
  user_is_bottleneck BOOLEAN DEFAULT false, -- User is only link
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, participant_a_id, participant_b_id)
);

-- ============================================================================
-- LAYER 3: ENRICHED DATA (LLM-enhanced)
-- ============================================================================

-- Content Classifications Table
-- LLM-derived insights from message content
CREATE TABLE IF NOT EXISTS public.content_classifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_cache_id UUID NOT NULL REFERENCES public.message_cache(id) ON DELETE CASCADE,
  
  -- Classification results
  topics TEXT[], -- ['Product Roadmap', 'Q4 Planning']
  intent TEXT, -- 'delegation', 'execution', 'decision', 'question', 'update'
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  sentiment_score DECIMAL, -- -1.0 to 1.0
  
  -- Strategic alignment
  strategic_priority TEXT, -- Maps to user's OKRs/goals
  
  -- Communication patterns
  is_firefighting BOOLEAN DEFAULT false, -- Contains urgent/ASAP keywords
  is_introduction BOOLEAN DEFAULT false, -- Introducing two people
  
  -- LLM metadata
  model_used TEXT, -- 'gpt-4', 'gpt-3.5-turbo', 'keyword-match'
  confidence_score DECIMAL, -- 0.0 to 1.0
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action Items Table
-- Extracted action items from emails and meetings
CREATE TABLE IF NOT EXISTS public.action_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Source
  message_cache_id UUID REFERENCES public.message_cache(id) ON DELETE CASCADE,
  -- meeting_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE, -- Future
  
  -- Action item details
  description TEXT NOT NULL,
  assignee_email TEXT,
  due_date TIMESTAMPTZ,
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions Table
-- Extracted decisions from communications
CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Source
  message_cache_id UUID REFERENCES public.message_cache(id) ON DELETE CASCADE,
  
  -- Decision details
  description TEXT NOT NULL,
  decision_maker_email TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LAYER 4: METRICS (Calculated)
-- ============================================================================

-- Daily Metrics Table
-- Pre-calculated daily metrics for fast retrieval
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Date for this metric
  metric_date DATE NOT NULL,
  
  -- Relationship Velocity & Health
  response_time_reciprocity JSONB, -- { contact_email: score }
  thread_decay_rate DECIMAL,
  collaboration_temperature JSONB, -- { contact_email: score }
  
  -- Attention Economics
  cognitive_load_by_hour JSONB, -- { hour: score }
  context_switches INTEGER,
  reply_debt_score DECIMAL,
  
  -- Leadership Patterns
  delegation_ratio DECIMAL, -- delegation / (delegation + execution)
  execution_ratio DECIMAL,
  decision_ratio DECIMAL,
  communication_equity JSONB, -- { direct_report_email: time_share }
  
  -- Strategic Focus
  time_by_priority JSONB, -- { priority_name: minutes }
  proactive_ratio DECIMAL, -- proactive / (proactive + reactive)
  firefighting_count INTEGER,
  
  -- Personal Sustainability
  after_hours_percentage DECIMAL,
  focus_time_hours DECIMAL,
  collaborative_time_hours DECIMAL,
  energy_score_by_hour JSONB, -- { hour: score }
  
  -- Network Intelligence
  introductions_made INTEGER,
  bottleneck_count INTEGER,
  influence_ripple_multiplier DECIMAL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, metric_date)
);

-- Weekly Metrics Table
-- Aggregated weekly metrics
CREATE TABLE IF NOT EXISTS public.weekly_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Week identification
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Aggregated metrics (same structure as daily_metrics)
  avg_response_time_reciprocity JSONB,
  avg_thread_decay_rate DECIMAL,
  avg_collaboration_temperature JSONB,
  avg_cognitive_load DECIMAL,
  total_context_switches INTEGER,
  avg_reply_debt_score DECIMAL,
  avg_delegation_ratio DECIMAL,
  avg_communication_equity JSONB,
  time_by_priority JSONB,
  avg_proactive_ratio DECIMAL,
  total_firefighting_count INTEGER,
  avg_after_hours_percentage DECIMAL,
  avg_focus_time_hours DECIMAL,
  total_introductions_made INTEGER,
  avg_influence_ripple_multiplier DECIMAL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, week_start_date)
);

-- Historical Trends Table
-- Long-term trend data for comparisons
CREATE TABLE IF NOT EXISTS public.historical_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Metric identification
  metric_name TEXT NOT NULL,
  
  -- Trend data
  values JSONB NOT NULL, -- Array of { date, value } objects
  
  -- Statistical summary
  mean DECIMAL,
  median DECIMAL,
  std_dev DECIMAL,
  trend_direction TEXT, -- 'improving', 'stable', 'degrading'
  
  -- Time range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, metric_name, start_date, end_date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Email Threads
CREATE INDEX IF NOT EXISTS idx_email_threads_user_date 
  ON public.email_threads(user_id, last_message_date DESC);
CREATE INDEX IF NOT EXISTS idx_email_threads_abandoned 
  ON public.email_threads(user_id, is_abandoned) WHERE is_abandoned = true;

-- Thread Messages
CREATE INDEX IF NOT EXISTS idx_thread_messages_thread 
  ON public.thread_messages(thread_id, sequence_number);

-- Participants
CREATE INDEX IF NOT EXISTS idx_participants_user_email 
  ON public.participants(user_id, canonical_email);
CREATE INDEX IF NOT EXISTS idx_participants_domain 
  ON public.participants(user_id, domain);

-- Events Timeline
CREATE INDEX IF NOT EXISTS idx_events_timeline_user_date 
  ON public.events_timeline(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_timeline_type 
  ON public.events_timeline(user_id, event_type, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_timeline_context 
  ON public.events_timeline(user_id, context_category, event_date DESC);

-- Content Classifications
CREATE INDEX IF NOT EXISTS idx_content_classifications_message 
  ON public.content_classifications(message_cache_id);
CREATE INDEX IF NOT EXISTS idx_content_classifications_intent 
  ON public.content_classifications(intent);

-- Daily Metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date 
  ON public.daily_metrics(user_id, metric_date DESC);

-- Weekly Metrics
CREATE INDEX IF NOT EXISTS idx_weekly_metrics_user_week 
  ON public.weekly_metrics(user_id, week_start_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Email Threads
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own email threads" ON public.email_threads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage email threads" ON public.email_threads
  FOR ALL USING (true) WITH CHECK (true);

-- Thread Messages
ALTER TABLE public.thread_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own thread messages" ON public.thread_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.email_threads 
    WHERE email_threads.id = thread_messages.thread_id 
    AND email_threads.user_id = auth.uid()
  ));
CREATE POLICY "System can manage thread messages" ON public.thread_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own participants" ON public.participants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage participants" ON public.participants
  FOR ALL USING (true) WITH CHECK (true);

-- Events Timeline
ALTER TABLE public.events_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own events" ON public.events_timeline
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage events" ON public.events_timeline
  FOR ALL USING (true) WITH CHECK (true);

-- Relationships
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own relationships" ON public.relationships
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage relationships" ON public.relationships
  FOR ALL USING (true) WITH CHECK (true);

-- Content Classifications
ALTER TABLE public.content_classifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view content classifications" ON public.content_classifications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.message_cache 
    WHERE message_cache.id = content_classifications.message_cache_id 
    AND message_cache.user_id = auth.uid()
  ));
CREATE POLICY "System can manage content classifications" ON public.content_classifications
  FOR ALL USING (true) WITH CHECK (true);

-- Action Items
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own action items" ON public.action_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage action items" ON public.action_items
  FOR ALL USING (true) WITH CHECK (true);

-- Decisions
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own decisions" ON public.decisions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage decisions" ON public.decisions
  FOR ALL USING (true) WITH CHECK (true);

-- Daily Metrics
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own daily metrics" ON public.daily_metrics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage daily metrics" ON public.daily_metrics
  FOR ALL USING (true) WITH CHECK (true);

-- Weekly Metrics
ALTER TABLE public.weekly_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own weekly metrics" ON public.weekly_metrics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage weekly metrics" ON public.weekly_metrics
  FOR ALL USING (true) WITH CHECK (true);

-- Historical Trends
ALTER TABLE public.historical_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own historical trends" ON public.historical_trends
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage historical trends" ON public.historical_trends
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_email_threads_updated_at
  BEFORE UPDATE ON public.email_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_relationships_updated_at
  BEFORE UPDATE ON public.relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_daily_metrics_updated_at
  BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_historical_trends_updated_at
  BEFORE UPDATE ON public.historical_trends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.email_threads IS 'Layer 2: Reconstructed email threads with metadata';
COMMENT ON TABLE public.thread_messages IS 'Layer 2: Junction table linking messages to threads';
COMMENT ON TABLE public.participants IS 'Layer 2: Unified contact records with email normalization';
COMMENT ON TABLE public.events_timeline IS 'Layer 2: Chronological stream of all communication events';
COMMENT ON TABLE public.relationships IS 'Layer 2: Contact-to-contact relationship mapping';

COMMENT ON TABLE public.content_classifications IS 'Layer 3: LLM-derived content insights';
COMMENT ON TABLE public.action_items IS 'Layer 3: Extracted action items from communications';
COMMENT ON TABLE public.decisions IS 'Layer 3: Extracted decisions from communications';

COMMENT ON TABLE public.daily_metrics IS 'Layer 4: Pre-calculated daily metrics for all 18 Level 10 metrics';
COMMENT ON TABLE public.weekly_metrics IS 'Layer 4: Aggregated weekly metrics';
COMMENT ON TABLE public.historical_trends IS 'Layer 4: Long-term trend data for comparisons';
