#!/usr/bin/env tsx

/**
 * Test Analytics System - Check Current State
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('\n🔍 Checking Analytics System State...\n');
  
  // Get user with valid token
  const { data: tokens } = await supabase
    .from('user_tokens')
    .select('user_id, provider, expires_at')
    .eq('provider', 'google')
    .gte('expires_at', new Date().toISOString())
    .limit(1);
  
  if (!tokens || tokens.length === 0) {
    console.log('❌ No valid Gmail tokens found');
    return;
  }
  
  const userId = tokens[0].user_id;
  console.log(`✅ Found user with valid token: ${userId}\n`);
  
  // Check jobs
  console.log('📊 Recent Analytics Jobs:');
  const { data: jobs } = await supabase
    .from('analytics_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (!jobs || jobs.length === 0) {
    console.log('   ⚠️  No jobs found\n');
  } else {
    jobs.forEach((job, i) => {
      const age = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 1000);
      console.log(`   ${i + 1}. ${job.job_type}`);
      console.log(`      Status: ${job.status}`);
      console.log(`      Progress: ${job.progress}/${job.total}`);
      console.log(`      Age: ${age}s ago`);
      if (job.error) console.log(`      Error: ${job.error}`);
      console.log('');
    });
  }
  
  // Check message cache
  console.log('💾 Message Cache:');
  const { data: messages, count } = await supabase
    .from('message_cache')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .limit(5);
  
  console.log(`   Total: ${count} messages`);
  if (messages && messages.length > 0) {
    console.log(`   Latest: ${new Date(messages[0].internal_date).toLocaleString()}`);
  }
  console.log('');
  
  // Check insights
  console.log('🧠 Analytics Insights:');
  const { data: insights } = await supabase
    .from('analytics_insights')
    .select('insight_type, value, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (!insights || insights.length === 0) {
    console.log('   ⚠️  No insights found\n');
  } else {
    const grouped = insights.reduce((acc, insight) => {
      if (!acc[insight.insight_type]) {
        acc[insight.insight_type] = [];
      }
      acc[insight.insight_type].push(insight);
      return acc;
    }, {} as Record<string, any[]>);
    
    Object.entries(grouped).forEach(([type, items]) => {
      console.log(`   ${type}: ${items.length} entries`);
      const latest = items[0];
      console.log(`      Latest: ${new Date(latest.created_at).toLocaleString()}`);
      console.log(`      Value:`, JSON.stringify(latest.value, null, 2).split('\n').map((l, i) => i === 0 ? l : `             ${l}`).join('\n'));
    });
  }
  
  console.log('\n✅ Check complete!\n');
}

main().catch(console.error);
