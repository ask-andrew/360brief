#!/usr/bin/env tsx

/**
 * Test Level 10 Analytics Orchestrator
 * 
 * Runs the full analytics pipeline for the current user
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { runAnalyticsForUser } from '../src/services/analytics/orchestrator';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n🧪 Testing Level 10 Analytics Orchestrator\n');
  
  // Get user from command line or use default
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    console.error('❌ Usage: npx tsx scripts/test-orchestrator.ts <user-email>');
    console.error('   Example: npx tsx scripts/test-orchestrator.ts user@example.com');
    process.exit(1);
  }
  
  console.log(`📧 User Email: ${userEmail}\n`);
  
  // Get user ID from email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', userEmail)
    .single();
  
  if (profileError || !profile) {
    console.error('❌ User not found:', profileError);
    process.exit(1);
  }
  
  const userId = profile.id;
  console.log(`👤 User ID: ${userId}\n`);
  
  // Check if migration has been applied
  console.log('🔍 Checking if migration has been applied...');
  const { error: tableError } = await supabase
    .from('email_threads')
    .select('id')
    .limit(1);
  
  if (tableError) {
    console.error('\n❌ Migration not applied!');
    console.error('   The email_threads table does not exist.');
    console.error('   Please apply the migration first:');
    console.error('   See MIGRATION_SUMMARY.md for instructions\n');
    process.exit(1);
  }
  
  console.log('✅ Migration applied\n');
  
  // Run orchestrator
  const options = {
    daysBack: 30,
    forceFullRebuild: process.argv.includes('--force'),
    incremental: process.argv.includes('--incremental'),
  };
  
  console.log('⚙️  Options:');
  console.log(`   Days Back: ${options.daysBack}`);
  console.log(`   Force Rebuild: ${options.forceFullRebuild}`);
  console.log(`   Incremental: ${options.incremental}\n`);
  
  const result = await runAnalyticsForUser(
    supabase,
    userId,
    userEmail,
    options
  );
  
  // Display results
  console.log('\n📊 Results:');
  console.log(`   Success: ${result.success ? '✅' : '❌'}`);
  console.log(`   Threads Processed: ${result.threadsProcessed}`);
  console.log(`   Contacts Processed: ${result.contactsProcessed}`);
  console.log(`   Timeline Events: ${result.timelineEventsProcessed}`);
  console.log(`   Processing Time: ${(result.processingTimeMs / 1000).toFixed(2)}s`);
  
  if (result.errors.length > 0) {
    console.log(`\n⚠️  Errors (${result.errors.length}):`);
    result.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  console.log('\n');
  
  if (!result.success) {
    process.exit(1);
  }
}

main().catch(console.error);
