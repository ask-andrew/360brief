// Script to run clustering migration
// Run with: node scripts/run-clustering-migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250920_add_enhanced_clustering.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('🔄 Running clustering migration...');

  try {
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { query: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Clustering migration completed successfully!');
    console.log('📊 New tables created:');
    console.log('  - clustering_analytics');
    console.log('  - cluster_topics');
    console.log('  - clustering_insights (view)');
    console.log('🔧 Enhanced user_preferences table with clustering fields');

  } catch (err) {
    console.error('❌ Error running migration:', err);
    process.exit(1);
  }
}

// Alternative approach: split migration into chunks and execute
async function runMigrationInChunks() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read and split the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250920_add_enhanced_clustering.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Split by semicolons and filter out empty statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`🔄 Running clustering migration in ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim()) {
      try {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);

        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        });

        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error);
          console.error(`Statement: ${statement}`);
          // Continue with next statements for non-critical errors
          if (error.message?.includes('already exists')) {
            console.log('⚠️ Already exists, continuing...');
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Statement ${i + 1} completed`);
        }
      } catch (err) {
        console.error(`❌ Critical error on statement ${i + 1}:`, err);
        process.exit(1);
      }
    }
  }

  console.log('✅ Clustering migration completed successfully!');
}

// Try chunks approach first
runMigrationInChunks().catch(console.error);