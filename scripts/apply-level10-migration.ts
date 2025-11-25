#!/usr/bin/env tsx

/**
 * Apply Level 10 Analytics Foundation migration
 * Creates the 4-layer architecture for advanced analytics
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n🚀 Applying Level 10 Analytics Foundation Migration...\n');
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251124_level10_analytics_foundation.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('📄 Migration file loaded');
  console.log('📊 Creating 4-layer architecture:');
  console.log('   Layer 1: Raw Data (existing message_cache)');
  console.log('   Layer 2: Processed Data (threads, participants, timeline)');
  console.log('   Layer 3: Enriched Data (LLM classifications)');
  console.log('   Layer 4: Metrics (daily, weekly, trends)');
  console.log('');
  
  // Since we can't execute raw SQL directly via the Supabase client,
  // we'll provide instructions for manual execution
  console.log('⚠️  Manual Migration Required\n');
  console.log('The Supabase client does not support direct SQL execution.');
  console.log('Please apply this migration using one of these methods:\n');
  console.log('📌 Method 1: Supabase Dashboard (Recommended)');
  console.log('   1. Go to: https://supabase.com/dashboard/project/_/sql');
  console.log('   2. Click "New Query"');
  console.log('   3. Copy the contents of:');
  console.log(`      ${migrationPath}`);
  console.log('   4. Paste into the SQL Editor');
  console.log('   5. Click "Run"\n');
  
  console.log('📌 Method 2: Supabase CLI (if Docker is running)');
  console.log('   npx supabase db reset\n');
  
  console.log('📌 Method 3: Direct SQL Execution');
  console.log('   The migration SQL is available at:');
  console.log(`   ${migrationPath}\n`);
  
  // Write a summary file
  const summaryPath = path.join(__dirname, '../MIGRATION_SUMMARY.md');
  const summary = `# Level 10 Analytics Migration Summary

## Migration File
\`supabase/migrations/20251124_level10_analytics_foundation.sql\`

## What This Migration Creates

### Layer 2: Processed Data (Normalized)
- **email_threads** - Reconstructed email threads with threading logic
- **thread_messages** - Links messages to threads with sequence tracking
- **participants** - Unified contact records (email normalization)
- **events_timeline** - Chronological stream of all events
- **relationships** - Contact-to-contact mapping

### Layer 3: Enriched Data (LLM-enhanced)
- **content_classifications** - Topics, intent, sentiment from LLM
- **action_items** - Extracted action items
- **decisions** - Extracted decisions

### Layer 4: Metrics (Calculated)
- **daily_metrics** - All 18 Level 10 metrics calculated daily
- **weekly_metrics** - Weekly aggregations
- **historical_trends** - Long-term trend data

## Total Tables Created
13 new tables with indexes, RLS policies, and helper functions

## Next Steps After Migration
1. ✅ Apply migration (see instructions above)
2. Build thread reconstruction service
3. Build contact normalization service
4. Build timeline builder
5. Implement metric calculators
6. Create dashboard visualizations

## Status
- [x] Migration file created
- [ ] Migration applied to database
- [ ] Services implemented
- [ ] Tests written
- [ ] Dashboard updated
`;

  fs.writeFileSync(summaryPath, summary);
  console.log(`✅ Migration summary written to: ${summaryPath}\n`);
  
  console.log('🎯 Ready to proceed once migration is applied!\n');
}

main().catch(console.error);
