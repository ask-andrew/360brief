// Check clustering migration status
// GET /api/admin/check-clustering-migration

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    console.log('🔍 Checking clustering migration status...');

    const checks = {
      user_preferences_extended: false,
      clustering_analytics_exists: false,
      cluster_topics_exists: false,
      rls_policies_exist: false,
      functions_exist: false,
      indexes_exist: false,
      errors: []
    };

    // Check 1: user_preferences table extensions
    try {
      const { data: prefs, error: prefsError } = await supabase
        .from('user_preferences')
        .select('industry, role, clustering_preferences')
        .limit(1);

      if (!prefsError) {
        checks.user_preferences_extended = true;
      } else if (prefsError.code === 'PGRST116') {
        checks.errors.push('user_preferences missing new columns (industry, role, clustering_preferences)');
      }
    } catch (e) {
      checks.errors.push(`user_preferences check failed: ${e}`);
    }

    // Check 2: clustering_analytics table
    try {
      const { data: analytics, error: analyticsError } = await supabase
        .from('clustering_analytics')
        .select('id')
        .limit(1);

      if (!analyticsError) {
        checks.clustering_analytics_exists = true;
      } else if (analyticsError.code === 'PGRST106') {
        checks.errors.push('clustering_analytics table does not exist');
      }
    } catch (e) {
      checks.errors.push(`clustering_analytics check failed: ${e}`);
    }

    // Check 3: cluster_topics table
    try {
      const { data: topics, error: topicsError } = await supabase
        .from('cluster_topics')
        .select('id')
        .limit(1);

      if (!topicsError) {
        checks.cluster_topics_exists = true;
      } else if (topicsError.code === 'PGRST106') {
        checks.errors.push('cluster_topics table does not exist');
      }
    } catch (e) {
      checks.errors.push(`cluster_topics check failed: ${e}`);
    }

    // Check 4: Test RLS policies by trying to insert (will fail but should give policy error, not table error)
    try {
      const { error: rlsError } = await supabase
        .from('clustering_analytics')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          digest_id: 'test',
          total_messages: 1,
          clusters_found: 0,
          messages_clustered: 0,
          clustering_rate: 0,
          processing_time_ms: 0,
          user_tier: 'free',
          clustering_method: 'test'
        });

      if (rlsError && (rlsError.code === 'PGRST301' || rlsError.message?.includes('policy'))) {
        checks.rls_policies_exist = true;
      }
    } catch (e) {
      // RLS policy check is optional
    }

    // Calculate migration status
    const migrationComplete = checks.user_preferences_extended &&
                             checks.clustering_analytics_exists &&
                             checks.cluster_topics_exists;

    return NextResponse.json({
      migration_complete: migrationComplete,
      status: migrationComplete ? 'success' : 'incomplete',
      checks,
      next_steps: migrationComplete ?
        ['Migration is complete! Clustering system is ready to use.'] :
        [
          'Run the clustering migration SQL in Supabase Dashboard',
          'Go to Dashboard > SQL Editor',
          'Paste the migration SQL provided',
          'Execute the query'
        ],
      migration_sql_needed: !migrationComplete
    });

  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json(
      {
        error: 'Migration check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        migration_complete: false
      },
      { status: 500 }
    );
  }
}