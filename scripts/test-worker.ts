#!/usr/bin/env tsx

/**
 * Test the Analytics Worker
 * 
 * This script:
 * 1. Creates a test job
 * 2. Verifies the worker picks it up
 * 3. Monitors progress
 * 4. Verifies completion
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testWorker() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING ANALYTICS WORKER');
  console.log('='.repeat(70) + '\n');

  // Get a user who has Gmail connected
  const { data: tokens, error: tokenError } = await supabase
    .from('user_tokens')
    .select('user_id, profiles(email)')
    .eq('provider', 'google')
    .limit(1);

  if (tokenError || !tokens || tokens.length === 0) {
    console.error('❌ No users with Gmail tokens found');
    console.log('💡 Please connect Gmail via the app first:');
    console.log('   1. Go to http://localhost:3000');
    console.log('   2. Click "Connect Gmail"');
    console.log('   3. Complete OAuth flow');
    console.log('   4. Run this test again\n');
    return;
  }

  const user = {
    id: tokens[0].user_id,
    email: (tokens[0].profiles as any)?.email || 'unknown'
  };

  console.log(`✅ Using user with Gmail connected: ${user.email}`);

  // Create a test job
  console.log('\n1️⃣  Creating test job...');
  
  const { data: job, error: jobError } = await supabase
    .from('analytics_jobs')
    .insert({
      user_id: user.id,
      job_type: 'fetch_messages',
      status: 'pending',
      progress: 0,
      total: 100,
      metadata: { days_back: 7, test: true }
    })
    .select()
    .single();

  if (jobError) {
    console.error('❌ Failed to create job:', jobError);
    return;
  }

  console.log(`✅ Job created: ${job.id}`);
  console.log(`   Status: ${job.status}`);

  // Monitor job progress
  console.log('\n2️⃣  Monitoring job progress...');
  console.log('   (Worker should pick this up within 5 seconds)\n');

  let lastStatus = job.status;
  const startTime = Date.now();
  const maxWait = 60000; // 1 minute

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s

    const { data: updatedJob } = await supabase
      .from('analytics_jobs')
      .select('*')
      .eq('id', job.id)
      .single();

    if (!updatedJob) break;

    // Show status changes
    if (updatedJob.status !== lastStatus) {
      console.log(`   Status changed: ${lastStatus} → ${updatedJob.status}`);
      lastStatus = updatedJob.status;
    }

    // Show progress
    const percentage = updatedJob.total > 0 
      ? Math.floor((updatedJob.progress / updatedJob.total) * 100)
      : 0;
    
    const step = updatedJob.metadata?.current_step || '';
    console.log(`   Progress: ${percentage}% (${updatedJob.progress}/${updatedJob.total}) ${step}`);

    // Check if complete
    if (updatedJob.status === 'completed') {
      console.log('\n✅ Job completed successfully!');
      console.log(`   Duration: ${Math.floor((Date.now() - startTime) / 1000)}s`);
      console.log(`   Result: ${JSON.stringify(updatedJob.metadata, null, 2)}`);
      break;
    }

    if (updatedJob.status === 'failed') {
      console.log('\n❌ Job failed!');
      console.log(`   Error: ${updatedJob.error}`);
      break;
    }

    // Timeout check
    if (Date.now() - startTime > maxWait) {
      console.log('\n ⚠️  Timeout reached. Job still processing...');
      console.log(`   Current status: ${updatedJob.status}`);
      console.log(`   Make sure the worker is running: npm run worker:dev`);
      break;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🏁 Test complete!');
  console.log('='.repeat(70) + '\n');
}

testWorker()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
