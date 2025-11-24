#!/usr/bin/env tsx

/**
 * Diagnostic Script: Check Analytics System Health
 * 
 * This script checks:
 * 1. Database connection
 * 2. User authentication
 * 3. Gmail tokens
 * 4. Message cache
 * 5. Analytics jobs
 * 6. Worker status
 */

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
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

async function checkDatabaseConnection() {
  console.log('\n🔍 Checking database connection...');
  try {
    const { data, error } = await supabase.from('user_tokens').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function checkUsers() {
  console.log('\n👥 Checking users...');
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    console.log(`✅ Found ${users.users.length} user(s)`);
    
    if (users.users.length > 0) {
      const user = users.users[0];
      console.log(`   Latest user: ${user.email} (${user.id})`);
      return user.id;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch users:', error);
    return null;
  }
}

async function checkGmailTokens(userId: string) {
  console.log('\n📧 Checking Gmail tokens...');
  try {
    const { data: tokens, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google');
    
    if (error) throw error;
    
    if (!tokens || tokens.length === 0) {
      console.log('⚠️  No Gmail tokens found');
      return false;
    }
    
    const token = tokens[0];
    const expiresAt = new Date(token.expires_at);
    const isExpired = expiresAt < new Date();
    
    console.log('✅ Gmail token found');
    console.log(`   Expires: ${expiresAt.toLocaleString()}`);
    console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✓ Valid'}`);
    console.log(`   Has refresh token: ${token.refresh_token ? '✓' : '✗'}`);
    
    return !isExpired || !!token.refresh_token;
  } catch (error) {
    console.error('❌ Failed to check Gmail tokens:', error);
    return false;
  }
}

async function checkMessageCache(userId: string) {
  console.log('\n💾 Checking message cache...');
  try {
    const { data: messages, error } = await supabase
      .from('message_cache')
      .select('count')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const count = messages?.length || 0;
    console.log(`${count > 0 ? '✅' : '⚠️ '} Found ${count} cached message(s)`);
    
    if (count > 0) {
      // Get latest message date
      const { data: latest } = await supabase
        .from('message_cache')
        .select('internal_date')
        .eq('user_id', userId)
        .order('internal_date', { ascending: false })
        .limit(1);
      
      if (latest && latest[0]) {
        console.log(`   Latest message: ${new Date(latest[0].internal_date).toLocaleString()}`);
      }
    }
    
    return count > 0;
  } catch (error) {
    console.error('❌ Failed to check message cache:', error);
    return false;
  }
}

async function checkAnalyticsJobs(userId: string) {
  console.log('\n📊 Checking analytics jobs...');
  try {
    const { data: jobs, error } = await supabase
      .from('analytics_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    if (!jobs || jobs.length === 0) {
      console.log('⚠️  No analytics jobs found');
      return false;
    }
    
    console.log(`✅ Found ${jobs.length} job(s)`);
    
    jobs.forEach((job, i) => {
      const age = Date.now() - new Date(job.created_at).getTime();
      const ageMinutes = Math.floor(age / 60000);
      console.log(`   ${i + 1}. ${job.job_type} - ${job.status} (${ageMinutes}m ago)`);
    });
    
    const latestJob = jobs[0];
    return latestJob.status === 'completed';
  } catch (error) {
    console.error('❌ Failed to check analytics jobs:', error);
    return false;
  }
}

async function checkInsights(userId: string) {
  console.log('\n🧠 Checking analytics insights...');
  try {
    const { data: insights, error } = await supabase
      .from('analytics_insights')
      .select('insight_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!insights || insights.length === 0) {
      console.log('⚠️  No insights found');
      return false;
    }
    
    console.log(`✅ Found ${insights.length} insight(s)`);
    
    const insightTypes = new Set(insights.map(i => i.insight_type));
    insightTypes.forEach(type => {
      const count = insights.filter(i => i.insight_type === type).length;
      console.log(`   ${type}: ${count}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to check insights:', error);
    return false;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     360Brief Analytics System Diagnostic                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    console.error('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  const userId = await checkUsers();
  if (!userId) {
    console.error('\n❌ No users found. Please sign up first.');
    process.exit(1);
  }
  
  const gmailOk = await checkGmailTokens(userId);
  const cacheOk = await checkMessageCache(userId);
  const jobsOk = await checkAnalyticsJobs(userId);
  const insightsOk = await checkInsights(userId);
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    System Status                          ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║ Database Connection:    ${dbOk ? '✅ OK' : '❌ FAILED'}                          ║`);
  console.log(`║ Gmail Tokens:           ${gmailOk ? '✅ OK' : '⚠️  MISSING/EXPIRED'}              ║`);
  console.log(`║ Message Cache:          ${cacheOk ? '✅ OK' : '⚠️  EMPTY'}                       ║`);
  console.log(`║ Analytics Jobs:         ${jobsOk ? '✅ OK' : '⚠️  NONE/INCOMPLETE'}             ║`);
  console.log(`║ Insights:               ${insightsOk ? '✅ OK' : '⚠️  NONE'}                      ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  console.log('\n📋 Recommendations:');
  
  if (!gmailOk) {
    console.log('   1. Connect Gmail account at /api/auth/gmail/authorize');
  }
  
  if (!cacheOk) {
    console.log('   2. Start the analytics worker: npm run worker:dev');
    console.log('   3. Create a job to fetch messages');
  }
  
  if (!jobsOk) {
    console.log('   4. Visit /analytics to trigger job creation');
  }
  
  if (!insightsOk) {
    console.log('   5. Wait for worker to compute insights');
  }
  
  if (gmailOk && cacheOk && jobsOk && insightsOk) {
    console.log('   ✅ System is healthy! Analytics should be working.');
  }
  
  console.log('\n');
}

main().catch(console.error);
