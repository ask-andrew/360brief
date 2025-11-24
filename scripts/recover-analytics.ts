#!/usr/bin/env tsx

/**
 * Analytics System Recovery Script
 * 
 * This script helps recover the analytics system by:
 * 1. Creating a test analytics job
 * 2. Checking if worker is needed
 * 3. Providing next steps
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getLatestUser() {
  const { data: users } = await supabase.auth.admin.listUsers();
  return users?.users[0] || null;
}

async function createTestJob(userId: string) {
  console.log('\n📝 Creating test analytics job...');
  
  const { data: job, error } = await supabase
    .from('analytics_jobs')
    .insert({
      user_id: userId,
      job_type: 'fetch_messages',
      status: 'pending',
      metadata: {
        days_back: 7,
        max_messages: 500,
      },
      progress: 0,
      total: 100,
      retry_count: 0,
      max_retries: 3,
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Failed to create job:', error);
    return null;
  }
  
  console.log('✅ Job created:', job.id);
  console.log(`   Status: ${job.status}`);
  console.log(`   Type: ${job.job_type}`);
  
  return job;
}

async function checkWorkerNeeded() {
  console.log('\n🤖 Checking if worker is needed...');
  
  const { data: pendingJobs } = await supabase
    .from('analytics_jobs')
    .select('count')
    .in('status', ['pending', 'processing']);
  
  const count = pendingJobs?.length || 0;
  
  if (count > 0) {
    console.log(`⚠️  Found ${count} pending/processing job(s)`);
    console.log('   Worker is needed to process these jobs');
    return true;
  } else {
    console.log('✅ No pending jobs');
    return false;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     360Brief Analytics Recovery                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  const user = await getLatestUser();
  if (!user) {
    console.error('\n❌ No users found. Please sign up first.');
    process.exit(1);
  }
  
  console.log(`\n👤 Using user: ${user.email}`);
  
  // Check if user has Gmail tokens
  const { data: tokens } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'google');
  
  if (!tokens || tokens.length === 0) {
    console.log('\n⚠️  No Gmail tokens found');
    console.log('   Please connect Gmail first:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Visit: http://localhost:3000/api/auth/gmail/authorize');
    console.log('   3. Complete OAuth flow');
    console.log('   4. Run this script again');
    return;
  }
  
  console.log('✅ Gmail tokens found');
  
  // Create test job
  const job = await createTestJob(user.id);
  if (!job) {
    console.error('\n❌ Failed to create test job');
    process.exit(1);
  }
  
  // Check if worker is needed
  const workerNeeded = await checkWorkerNeeded();
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    Next Steps                             ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  
  if (workerNeeded) {
    console.log('║ 1. Start the analytics worker:                           ║');
    console.log('║    npm run worker:dev                                     ║');
    console.log('║                                                           ║');
    console.log('║ 2. Watch the worker process the job                      ║');
    console.log('║                                                           ║');
    console.log('║ 3. Once complete, visit /analytics to see insights       ║');
  } else {
    console.log('║ 1. Visit /analytics to see your insights                 ║');
    console.log('║                                                           ║');
    console.log('║ 2. If data doesn\'t load, check browser console           ║');
  }
  
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
