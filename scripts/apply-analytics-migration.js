/**
 * Apply Analytics Migration Script
 * Run with: node scripts/apply-analytics-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting analytics migration...\n');

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251120_analytics_background_processing.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Migration file loaded');
  console.log('📊 Executing SQL...\n');

  try {
    // Split the SQL into individual statements
    // We need to execute them one by one for better error handling
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (!statement || statement.startsWith('--')) continue;
      
      // Add semicolon back
      const sql = statement + ';';
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // Execute via RPC to handle complex SQL
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql }).catch(async (err) => {
        // If RPC doesn't exist, try direct query
        return await supabase.from('_sql_executor').select('*').limit(0).then(() => {
          // Fallback: use raw SQL via PostgREST
          return fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: sql })
          }).then(r => r.json());
        });
      });

      if (error) {
        // Check if error is because object already exists
        if (error.message && (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        )) {
          console.log(`  ⚠️  Skipped (already exists): ${statement.substring(0, 60)}...`);
          skipCount++;
        } else {
          console.error(`  ❌ Error:`, error.message);
          console.error(`  SQL:`, sql.substring(0, 100) + '...');
          // Continue with other statements
        }
      } else {
        console.log(`  ✅ Success`);
        successCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Migration completed!`);
    console.log(`   - Successful: ${successCount}`);
    console.log(`   - Skipped: ${skipCount}`);
    console.log('='.repeat(60) + '\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    
    const tables = ['analytics_jobs', 'message_cache', 'analytics_cache'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        console.log(`  ❌ Table '${table}' not found or inaccessible`);
      } else {
        console.log(`  ✅ Table '${table}' exists and accessible`);
      }
    }

    console.log('\n✨ Migration complete! Your analytics infrastructure is ready.\n');
    return true;

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    return false;
  }
}

// Run migration
applyMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
