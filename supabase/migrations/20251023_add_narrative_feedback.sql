-- Migration: Add narrative feedback system for improving synthesis quality
-- Filename: supabase/migrations/20251023_add_narrative_feedback.sql

-- Create narrative_feedback table for capturing user feedback on brief quality
CREATE TABLE IF NOT EXISTS narrative_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Brief generation metadata
    brief_id UUID, -- Optional: link to specific brief if available
    engine_used TEXT NOT NULL, -- e.g., 'enhanced_narrative_v2_llm', 'narrative_v1_fallback'
    generation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Input data that was processed
    input_emails_count INTEGER NOT NULL,
    input_clusters_count INTEGER NOT NULL,
    cluster_data JSONB NOT NULL, -- Full cluster information that was processed

    -- LLM synthesis data (if used)
    llm_prompt TEXT, -- The prompt sent to LLM
    llm_model TEXT, -- Model used (e.g., 'gemini-1.5-flash')
    llm_response_time_ms INTEGER, -- Response time for analysis

    -- Generated output
    generated_markdown TEXT NOT NULL, -- The actual narrative that was generated
    executive_summary TEXT, -- Extracted executive summary for analysis

    -- User feedback
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful')),
    feedback_comments TEXT, -- Optional user comments
    feedback_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Quality metrics for analysis
    markdown_length INTEGER, -- Length of generated content
    clusters_covered INTEGER, -- Number of clusters actually covered in narrative
    actions_mentioned INTEGER, -- Number of actionable items mentioned

    -- Domain classification for targeted improvements
    project_types TEXT[], -- Array of project types detected (e.g., ['financial', 'hr', 'technical'])
    has_financial_content BOOLEAN DEFAULT FALSE,
    has_decision_content BOOLEAN DEFAULT FALSE,
    has_blocker_content BOOLEAN DEFAULT FALSE,

    CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('helpful', 'not_helpful')),
    CONSTRAINT positive_counts CHECK (
        input_emails_count > 0 AND
        input_clusters_count > 0 AND
        markdown_length > 0
    )
);

-- Create indexes for efficient feedback analysis
CREATE INDEX IF NOT EXISTS idx_narrative_feedback_user_date
ON narrative_feedback(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_narrative_feedback_engine
ON narrative_feedback(engine_used, feedback_type);

CREATE INDEX IF NOT EXISTS idx_narrative_feedback_project_types
ON narrative_feedback USING gin(project_types);

CREATE INDEX IF NOT EXISTS idx_narrative_feedback_content_types
ON narrative_feedback(has_financial_content, has_decision_content, has_blocker_content)
WHERE feedback_type = 'not_helpful';

-- Create view for feedback analysis
CREATE OR REPLACE VIEW narrative_feedback_analysis AS
SELECT
    engine_used,
    feedback_type,
    COUNT(*) as feedback_count,
    AVG(markdown_length) as avg_markdown_length,
    AVG(clusters_covered::decimal / input_clusters_count::decimal) as coverage_rate,
    AVG(actions_mentioned) as avg_actions_per_brief,
    COUNT(CASE WHEN has_financial_content THEN 1 END) as financial_briefs,
    COUNT(CASE WHEN has_decision_content THEN 1 END) as decision_briefs,
    COUNT(CASE WHEN has_blocker_content THEN 1 END) as blocker_briefs,
    AVG(llm_response_time_ms) as avg_response_time_ms,
    array_agg(DISTINCT unnest(project_types)) as unique_project_types
FROM narrative_feedback
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY engine_used, feedback_type
ORDER BY feedback_count DESC;

-- Create function to extract project types from cluster data
CREATE OR REPLACE FUNCTION extract_project_types(cluster_json JSONB)
RETURNS TEXT[] AS $$
DECLARE
    project_types TEXT[] := ARRAY[]::TEXT[];
    cluster RECORD;
    project_key TEXT;
    has_financial BOOLEAN := FALSE;
    has_decision BOOLEAN := FALSE;
    has_blocker BOOLEAN := FALSE;
BEGIN
    -- Extract from cluster data
    FOR cluster IN SELECT * FROM jsonb_array_elements(cluster_json)
    LOOP
        project_key := cluster->>'project_key';

        -- Classify based on project key patterns
        IF project_key ~* '(financial|budget|revenue|cost|pricing|payment)' THEN
            project_types := array_append(project_types, 'financial');
        ELSIF project_key ~* '(hr|people|team|staff|employee|recruit|hire)' THEN
            project_types := array_append(project_types, 'hr');
        ELSIF project_key ~* '(legal|contract|compliance|policy|regulation)' THEN
            project_types := array_append(project_types, 'legal');
        ELSIF project_key ~* '(technical|tech|engineering|software|dev|product)' THEN
            project_types := array_append(project_types, 'technical');
        ELSIF project_key ~* '(marketing|sales|customer|client|campaign)' THEN
            project_types := array_append(project_types, 'marketing');
        ELSIF project_key ~* '(operation|ops|process|workflow|system)' THEN
            project_types := array_append(project_types, 'operations');
        ELSE
            project_types := array_append(project_types, 'general');
        END IF;

        -- Check for specific content types
        IF cluster->>'has_financial_mentions' = 'true' THEN
            has_financial := TRUE;
        END IF;

        IF (cluster->'status_counts'->>'decision')::integer > 0 THEN
            has_decision := TRUE;
        END IF;

        IF (cluster->'status_counts'->>'blocker')::integer > 0 THEN
            has_blocker := TRUE;
        END IF;
    END LOOP;

    -- Remove duplicates
    project_types := ARRAY(SELECT DISTINCT unnest(project_types));

    RETURN project_types;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically extract project types and content flags
CREATE OR REPLACE FUNCTION process_narrative_feedback()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract project types from cluster data
    NEW.project_types := extract_project_types(NEW.cluster_data);

    -- Set content type flags
    NEW.has_financial_content := (NEW.generated_markdown ~* '\$[0-9,]+') OR
                                (NEW.generated_markdown ~* '(financial|budget|revenue|cost|payment)');
    NEW.has_decision_content := NEW.generated_markdown ~* '(decision|approve|authorize|decide)';
    NEW.has_blocker_content := NEW.generated_markdown ~* '(blocker|blocked|issue|problem|stuck|urgent)';

    -- Calculate metrics
    NEW.markdown_length := length(NEW.generated_markdown);
    NEW.clusters_covered := jsonb_array_length(NEW.cluster_data);
    NEW.actions_mentioned := (SELECT count(*) FROM regexp_matches(NEW.generated_markdown, '(Action|Decision|Approve|Review|Schedule|Meeting)', 'gi'));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER narrative_feedback_processing
    BEFORE INSERT ON narrative_feedback
    FOR EACH ROW
    EXECUTE FUNCTION process_narrative_feedback();

-- Add RLS policies for security
ALTER TABLE narrative_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "Users can view own narrative feedback" ON narrative_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own feedback
CREATE POLICY "Users can insert own narrative feedback" ON narrative_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can manage all feedback for analysis
CREATE POLICY "Service role can manage all narrative feedback" ON narrative_feedback
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Create table for feedback analysis results
CREATE TABLE IF NOT EXISTS narrative_feedback_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_date DATE DEFAULT CURRENT_DATE,
    engine_used TEXT NOT NULL,
    feedback_period_days INTEGER DEFAULT 30,

    -- Quality metrics
    total_feedback INTEGER NOT NULL,
    helpful_percentage DECIMAL(5,2),
    avg_markdown_length INTEGER,
    avg_coverage_rate DECIMAL(4,3),
    avg_actions_per_brief DECIMAL(4,2),

    -- Problem areas
    most_problematic_project_types TEXT[],
    financial_brief_success_rate DECIMAL(5,2),
    decision_brief_success_rate DECIMAL(5,2),
    blocker_brief_success_rate DECIMAL(5,2),

    -- Improvement recommendations
    suggested_prompt_changes TEXT[],
    suggested_rule_updates TEXT[],

    -- Raw analysis data
    analysis_data JSONB,

    CONSTRAINT valid_percentage CHECK (helpful_percentage >= 0 AND helpful_percentage <= 100),
    CONSTRAINT positive_period CHECK (feedback_period_days > 0)
);

-- Create index for insights queries
CREATE INDEX IF NOT EXISTS idx_narrative_feedback_insights_date
ON narrative_feedback_insights(analysis_date DESC, engine_used);

-- Grant necessary permissions
GRANT SELECT ON narrative_feedback_analysis TO authenticated;
GRANT SELECT ON narrative_feedback_insights TO authenticated;
