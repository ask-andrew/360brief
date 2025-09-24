// Admin endpoint to run clustering migration
// POST /api/admin/run-clustering-migration

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated (basic auth check)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Running clustering migration...');

    // Step 1: Extend user_preferences table
    console.log('📝 Step 1: Extending user_preferences table...');
    const { error: step1Error } = await supabase
      .from('user_preferences')
      .select('industry, role, clustering_preferences')
      .limit(1);

    if (step1Error && step1Error.code === 'PGRST116') {
      // Column doesn't exist, need to add it
      return NextResponse.json({
        error: 'Migration requires database admin access',
        message: 'Please run the migration manually in Supabase dashboard',
        sql: `
-- Step 1: Extend user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS clustering_preferences JSONB DEFAULT '{}';

-- Step 2: Create clustering_analytics table
CREATE TABLE IF NOT EXISTS clustering_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_id TEXT NOT NULL,
  processing_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_messages INTEGER NOT NULL,
  clusters_found INTEGER NOT NULL,
  messages_clustered INTEGER NOT NULL,
  clustering_rate DECIMAL(5,3) NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  avg_confidence DECIMAL(4,3),
  largest_cluster_size INTEGER,
  user_tier TEXT NOT NULL CHECK (user_tier IN ('free', 'paid')),
  clustering_method TEXT NOT NULL,
  upgrade_suggestions JSONB DEFAULT '[]',
  user_clicked_upgrade BOOLEAN DEFAULT FALSE,
  pattern_success_rate DECIMAL(4,3),
  entity_success_rate DECIMAL(4,3),
  semantic_success_rate DECIMAL(4,3),
  CONSTRAINT valid_clustering_rate CHECK (clustering_rate >= 0 AND clustering_rate <= 1),
  CONSTRAINT valid_confidence CHECK (avg_confidence >= 0 AND avg_confidence <= 1)
);

-- Step 3: Create cluster_topics table
CREATE TABLE IF NOT EXISTS cluster_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  topic_category TEXT NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  key_entities JSONB DEFAULT '{}',
  key_patterns JSONB DEFAULT '[]',
  avg_confidence DECIMAL(4,3),
  user_confirmed BOOLEAN DEFAULT NULL,
  user_renamed_to TEXT,
  UNIQUE(user_id, topic_name)
);

-- Step 4: Enable RLS
ALTER TABLE clustering_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_topics ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Users can view own clustering analytics" ON clustering_analytics
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clustering analytics" ON clustering_analytics
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own cluster topics" ON cluster_topics
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cluster topics" ON cluster_topics
FOR ALL USING (auth.uid() = user_id);
        `
      }, { status: 200 });
    }

    // Check if tables exist by trying to query them
    console.log('📝 Step 2: Checking clustering_analytics table...');
    const { error: analyticsError } = await supabase
      .from('clustering_analytics')
      .select('id')
      .limit(1);

    console.log('📝 Step 3: Checking cluster_topics table...');
    const { error: topicsError } = await supabase
      .from('cluster_topics')
      .select('id')
      .limit(1);

    if (!analyticsError && !topicsError) {
      return NextResponse.json({
        success: true,
        message: 'Clustering tables already exist and are accessible',
        status: 'ready'
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Tables may exist but RLS policies may be missing',
      analyticsError: analyticsError?.message,
      topicsError: topicsError?.message,
      action: 'Check Supabase dashboard for table creation and RLS policies'
    });

  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json(
      { error: 'Migration check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}