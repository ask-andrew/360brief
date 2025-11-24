#!/usr/bin/env tsx

/**
 * Manually create and trigger a compute_insights job
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n🧠 Creating compute_insights job...\n');
  
  // Get user with valid token
  const { data: tokens } = await supabase
    .from('user_tokens')
    .select('user_id')
    .eq('provider', 'google')
    .gte('expires_at', new Date().toISOString())
    .limit(1);
  
  if (!tokens || tokens.length === 0) {
    console.log('❌ No valid Gmail tokens found');
    return;
  }
  
  const userId = tokens[0].user_id;
  console.log(`✅ User ID: ${userId}\n`);
  
  // Create compute_insights job
  const { data: job, error } = await supabase
    .from('analytics_jobs')
    .insert({
      user_id: userId,
      job_type: 'compute_insights',
      status: 'pending',
      progress: 0,
      total: 100,
      metadata: {},
      retry_count: 0,
      max_retries: 3,
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating job:', error);
    return;
  }
  
  console.log('✅ Job created:', job.id);
  console.log('   Type:', job.job_type);
  console.log('   Status:', job.status);
  console.log('\n📊 Worker should pick this up within 5 seconds...');
  console.log('   Watch the worker terminal for processing logs\n');
  
  // Wait and check status
  console.log('⏳ Waiting 10 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const { data: updatedJob } = await supabase
    .from('analytics_jobs')
    .select('*')
    .eq('id', job.id)
    .single();
  
  if (updatedJob) {
    console.log('📊 Job Status After 10s:');
    console.log('   Status:', updatedJob.status);
    console.log('   Progress:', `${updatedJob.progress}/${updatedJob.total}`);
    if (updatedJob.error) {
      console.log('   Error:', updatedJob.error);
    }
  }
  
  // Check if insights were created
  const { data: insights } = await supabase
    .from('analytics_insights')
    .select('insight_type')
    .eq('user_id', userId);
  
  console.log('\n🧠 Insights Count:', insights?.length || 0);
  if (insights && insights.length > 0) {
    const types = [...new Set(insights.map(i => i.insight_type))];
    console.log('   Types:', types.join(', '));
  }
  
  console.log('\n');
}

main().catch(console.error);
