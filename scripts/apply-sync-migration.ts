#!/usr/bin/env tsx

/**
 * Apply Last Sync Tracking Migration
 * 
 * Adds incremental sync capability to user_tokens table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('\n🔄 Applying incremental sync migration...\n');

  try {
    // Step 1: Add last_sync_at column
    console.log('1️⃣  Adding last_sync_at column...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;`
    });
    
    // If rpc doesn't exist, try direct approach
    if (error1) {
      console.log('   Using direct SQL execution...');
      // We'll need to do this via the dashboard or a different method
      console.log('   ⚠️  Please run this SQL in your Supabase dashboard:');
      console.log('\n' + '─'.repeat(60));
      console.log(`
-- Add incremental sync tracking columns
ALTER TABLE user_tokens
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_message_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_messages_synced INTEGER DEFAULT 0;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_tokens_last_sync 
ON user_tokens(user_id, last_sync_at);

-- Add comments for documentation
COMMENT ON COLUMN user_tokens.last_sync_at IS 'Timestamp of last successful Gmail sync';
COMMENT ON COLUMN user_tokens.last_message_date IS 'Date of the most recent message we have synced';
COMMENT ON COLUMN user_tokens.total_messages_synced IS 'Total count of messages synced for this user';

-- Initialize existing rows
UPDATE user_tokens
SET last_sync_at = NOW() - INTERVAL '7 days',
    total_messages_synced = 0
WHERE last_sync_at IS NULL AND provider = 'google';
      `);
      console.log('─'.repeat(60) + '\n');
      
      console.log('📋 Steps to apply migration:');
      console.log('   1. Go to: https://supabase.com/dashboard');
      console.log('   2. Select your 360brief project');
      console.log('   3. Navigate to: SQL Editor');
      console.log('   4. Copy the SQL above');
      console.log('   5. Paste and click "Run"\n');
      
      console.log('💡 Or view the full migration file:');
      console.log('   supabase/migrations/20251121_add_last_sync_tracking.sql\n');
      
      return;
    }

    console.log('   ✅ Added last_sync_at');

    // Step 2: Add last_message_date column
    console.log('2️⃣  Adding last_message_date column...');
    await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS last_message_date TIMESTAMPTZ;`
    });
    console.log('   ✅ Added last_message_date');

    // Step 3: Add total_messages_synced column
    console.log('3️⃣  Adding total_messages_synced column...');
    await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS total_messages_synced INTEGER DEFAULT 0;`
    });
    console.log('   ✅ Added total_messages_synced');

    // Step 4: Create index
    console.log('4️⃣  Creating index...');
    await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_user_tokens_last_sync ON user_tokens(user_id, last_sync_at);`
    });
    console.log('   ✅ Created index');

    // Step 5: Initialize existing rows
    console.log('5️⃣  Initializing existing rows...');
    const { error: updateError } = await supabase
      .from('user_tokens')
      .update({
        last_sync_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        total_messages_synced: 0
      })
      .is('last_sync_at', null)
      .eq('provider', 'google');

    if (updateError) {
      console.log('   ⚠️  Could not initialize rows:', updateError.message);
    } else {
      console.log('   ✅ Initialized existing rows');
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('🚀 Incremental sync is now enabled!\n');

  } catch (error) {
    console.error('\n❌ Error applying migration:', error);
    console.log('\n💡 Try applying the migration manually via Supabase dashboard.');
    console.log('   Migration file: supabase/migrations/20251121_add_last_sync_tracking.sql\n');
    process.exit(1);
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
