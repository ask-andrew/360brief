// Complete clustering migration with missing components
// POST /api/admin/complete-clustering-migration

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Please run this SQL in Supabase Dashboard > SQL Editor to complete the migration',
    sql: `
-- Complete clustering migration - missing functions and indexes
-- Run this in Supabase Dashboard > SQL Editor

-- Function to record clustering analytics
CREATE OR REPLACE FUNCTION record_clustering_analytics(
    p_user_id UUID,
    p_digest_id TEXT,
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

-- Test the functions work
SELECT 'Functions created successfully' as status;
    `,
    status: 'Tables exist, functions needed'
  });
}