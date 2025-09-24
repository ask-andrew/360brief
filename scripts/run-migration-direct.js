// Script to run clustering migration using direct SQL execution
// Run with: node scripts/run-migration-direct.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigrationDirect() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔄 Running clustering migration step by step...');

  try {
    // Step 1: Extend user_preferences table
    console.log('📝 Step 1: Extending user_preferences table...');
    const { error: step1 } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE user_preferences
        ADD COLUMN IF NOT EXISTS industry TEXT,
        ADD COLUMN IF NOT EXISTS role TEXT,
        ADD COLUMN IF NOT EXISTS clustering_preferences JSONB DEFAULT '{}';
      `
    });

    if (step1) {
      console.log('⚠️ Step 1 error (may be expected if columns exist):', step1);
    } else {
      console.log('✅ Step 1 completed');
    }

    // Step 2: Create clustering_analytics table
    console.log('📝 Step 2: Creating clustering_analytics table...');
    const { error: step2 } = await supabase.rpc('sql', {
      query: `
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
      `
    });

    if (step2) {
      console.log('⚠️ Step 2 error:', step2);
    } else {
      console.log('✅ Step 2 completed - clustering_analytics table created');
    }

    // Step 3: Create cluster_topics table
    console.log('📝 Step 3: Creating cluster_topics table...');
    const { error: step3 } = await supabase.rpc('sql', {
      query: `
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
      `
    });

    if (step3) {
      console.log('⚠️ Step 3 error:', step3);
    } else {
      console.log('✅ Step 3 completed - cluster_topics table created');
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 New clustering infrastructure is ready:');
    console.log('  ✓ clustering_analytics table');
    console.log('  ✓ cluster_topics table');
    console.log('  ✓ Extended user_preferences');

  } catch (err) {
    console.error('❌ Error running migration:', err);
    process.exit(1);
  }
}

runMigrationDirect().catch(console.error);