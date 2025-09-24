-- Migration: Add clustering support to 360Brief
-- Filename: supabase/migrations/add_enhanced_clustering.sql

-- Extend user_preferences table for clustering personalization
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS clustering_preferences JSONB DEFAULT '{}';

-- Create index for faster clustering preference queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_clustering 
ON user_preferences USING gin(clustering_preferences);

-- Create clustering_analytics table for tracking performance
CREATE TABLE IF NOT EXISTS clustering_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    digest_id UUID REFERENCES digests(id) ON DELETE CASCADE,
    processing_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Clustering metrics
    total_messages INTEGER NOT NULL,
    clusters_found INTEGER NOT NULL,
    messages_clustered INTEGER NOT NULL,
    clustering_rate DECIMAL(5,3) NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    
    -- Quality metrics
    avg_confidence DECIMAL(4,3),
    largest_cluster_size INTEGER,
    
    -- User tier and method used
    user_tier TEXT NOT NULL CHECK (user_tier IN ('free', 'paid')),
    clustering_method TEXT NOT NULL,
    
    -- Upgrade suggestions and user actions
    upgrade_suggestions JSONB DEFAULT '[]',
    user_clicked_upgrade BOOLEAN DEFAULT FALSE,
    
    -- Anonymous insights for improvement
    pattern_success_rate DECIMAL(4,3),
    entity_success_rate DECIMAL(4,3),
    semantic_success_rate DECIMAL(4,3),
    
    CONSTRAINT valid_clustering_rate CHECK (clustering_rate >= 0 AND clustering_rate <= 1),
    CONSTRAINT valid_confidence CHECK (avg_confidence >= 0 AND avg_confidence <= 1)
);

-- Create indexes for analytics queries
CREATE INDEX idx_clustering_analytics_user_date 
ON clustering_analytics(user_id, processing_date DESC);

CREATE INDEX idx_clustering_analytics_metrics 
ON clustering_analytics(user_tier, clustering_method, processing_date DESC);

-- Create cluster_topics table for tracking discovered topics
CREATE TABLE IF NOT EXISTS cluster_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    topic_category TEXT NOT NULL,
    
    -- Topic metadata
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    
    -- Topic characteristics
    key_entities JSONB DEFAULT '{}',
    key_patterns JSONB DEFAULT '[]',
    avg_confidence DECIMAL(4,3),
    
    -- User feedback
    user_confirmed BOOLEAN DEFAULT NULL,
    user_renamed_to TEXT,
    
    UNIQUE(user_id, topic_name)
);

-- Update digest_items metadata structure to include clustering info
-- (No schema change needed - using existing metadata JSONB column)
-- Expected metadata structure:
-- {
--   "clustering": {
--     "cluster_id": "cluster_0_vendor_management",
--     "topic_name": "HVAC System Quotes",
--     "topic_category": "vendor_management", 
--     "cluster_size": 5,
--     "confidence": 0.87,
--     "upgrade_hint": "AI could extract action items"
--   },
--   ... existing metadata fields
-- }

-- Create view for clustering insights dashboard
CREATE OR REPLACE VIEW clustering_insights AS
SELECT 
    ca.user_id,
    ca.user_tier,
    DATE_TRUNC('week', ca.processing_date) as week,
    
    -- Aggregated metrics
    AVG(ca.clustering_rate) as avg_clustering_rate,
    AVG(ca.avg_confidence) as avg_confidence,
    SUM(ca.total_messages) as total_messages_processed,
    SUM(ca.clusters_found) as total_clusters_found,
    
    -- Performance metrics
    AVG(ca.processing_time_ms) as avg_processing_time,
    
    -- Upgrade metrics
    COUNT(*) FILTER (WHERE array_length(ca.upgrade_suggestions::jsonb::text[]::text[], 1) > 0) as sessions_with_upgrade_hints,
    COUNT(*) FILTER (WHERE ca.user_clicked_upgrade = true) as upgrade_clicks,
    
    -- Top topic categories
    (
        SELECT jsonb_agg(jsonb_build_object('category', topic_category, 'count', count))
        FROM (
            SELECT ct.topic_category, COUNT(*) as count
            FROM cluster_topics ct
            WHERE ct.user_id = ca.user_id 
            AND ct.last_seen >= DATE_TRUNC('week', ca.processing_date)
            AND ct.last_seen < DATE_TRUNC('week', ca.processing_date) + INTERVAL '1 week'
            GROUP BY ct.topic_category
            ORDER BY count DESC
            LIMIT 5
        ) top_categories
    ) as top_topic_categories
    
FROM clustering_analytics ca
LEFT JOIN cluster_topics ct ON ca.user_id = ct.user_id
GROUP BY ca.user_id, ca.user_tier, DATE_TRUNC('week', ca.processing_date);

-- Create indexes for all new tables
CREATE INDEX IF NOT EXISTS idx_user_preferences_clustering 
ON user_preferences USING gin(clustering_preferences);

CREATE INDEX idx_clustering_analytics_user_date 
ON clustering_analytics(user_id, processing_date DESC);

CREATE INDEX idx_clustering_analytics_metrics 
ON clustering_analytics(user_tier, clustering_method, processing_date DESC);

CREATE INDEX idx_cluster_topics_user_category 
ON cluster_topics(user_id, topic_category, last_seen DESC);

-- Row Level Security policies
ALTER TABLE clustering_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_topics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own clustering data
CREATE POLICY "Users can view own clustering analytics" ON clustering_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clustering analytics" ON clustering_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own cluster topics" ON cluster_topics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cluster topics" ON cluster_topics
    FOR ALL USING (auth.uid() = user_id);

-- Function to record clustering analytics
CREATE OR REPLACE FUNCTION record_clustering_analytics(
    p_user_id UUID,
    p_digest_id UUID,
    p_metrics JSONB,
    p_user_tier TEXT,
    p_clustering_method TEXT,
    p_upgrade_suggestions JSONB DEFAULT '[]'
) RETURNS UUID AS $$
DECLARE
    analytics_id UUID;
BEGIN
    INSERT INTO clustering_analytics (
        user_id,
        digest_id,
        total_messages,
        clusters_found,
        messages_clustered,
        clustering_rate,
        processing_time_ms,
        avg_confidence,
        largest_cluster_size,
        user_tier,
        clustering_method,
        upgrade_suggestions
    ) VALUES (
        p_user_id,
        p_digest_id,
        (p_metrics->>'total_messages')::INTEGER,
        (p_metrics->>'clusters_found')::INTEGER,
        (p_metrics->>'messages_clustered')::INTEGER,
        (p_metrics->>'clustering_rate')::DECIMAL,
        COALESCE((p_metrics->>'processing_time_ms')::INTEGER, 0),
        COALESCE((p_metrics->>'avg_confidence')::DECIMAL, 0),
        COALESCE((p_metrics->>'largest_cluster_size')::INTEGER, 0),
        p_user_tier,
        p_clustering_method,
        p_upgrade_suggestions
    ) RETURNING id INTO analytics_id;
    
    RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update or insert cluster topics
CREATE OR REPLACE FUNCTION upsert_cluster_topic(
    p_user_id UUID,
    p_topic_name TEXT,
    p_topic_category TEXT,
    p_key_entities JSONB DEFAULT '{}',
    p_key_patterns JSONB DEFAULT '[]',
    p_confidence DECIMAL DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    topic_id UUID;
BEGIN
    INSERT INTO cluster_topics (
        user_id,
        topic_name,
        topic_category,
        key_entities,
        key_patterns,
        avg_confidence,
        occurrence_count
    ) VALUES (
        p_user_id,
        p_topic_name,
        p_topic_category,
        p_key_entities,
        p_key_patterns,
        p_confidence,
        1
    )
    ON CONFLICT (user_id, topic_name) DO UPDATE SET
        last_seen = NOW(),
        occurrence_count = cluster_topics.occurrence_count + 1,
        key_entities = COALESCE(p_key_entities, cluster_topics.key_entities),
        key_patterns = COALESCE(p_key_patterns, cluster_topics.key_patterns),
        avg_confidence = CASE 
            WHEN p_confidence IS NOT NULL THEN 
                (cluster_topics.avg_confidence * cluster_topics.occurrence_count + p_confidence) / (cluster_topics.occurrence_count + 1)
            ELSE cluster_topics.avg_confidence
        END
    RETURNING id INTO topic_id;
    
    RETURN topic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT ON clustering_analytics TO authenticated;
GRANT ALL ON cluster_topics TO authenticated;
GRANT EXECUTE ON FUNCTION record_clustering_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_cluster_topic TO authenticated;