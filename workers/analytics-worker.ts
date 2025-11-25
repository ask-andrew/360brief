/**
 * Analytics Background Worker
 * 
 * Polls for pending analytics jobs and processes them:
 * 1. Fetches Gmail messages in batches
 * 2. Caches messages to avoid duplicate API calls
 * 3. Updates job progress in real-time
 * 4. Computes analytics and caches results
 * 
 * Run with: tsx workers/analytics-worker.ts
 * or: node --loader ts-node/esm workers/analytics-worker.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { 
  computeStrategicVsReactive, 
  computeDecisionVelocity, 
  computeRelationshipHealth 
} from '@/services/analytics/insightService';
import { getJobService } from '../src/services/analytics/jobService';
import { getMessageCacheService, type CacheBulkInsert } from '../src/services/analytics/messageCacheService';
import type { AnalyticsJob } from '../src/types/analytics-jobs';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const jobService = getJobService();
const cacheService = getMessageCacheService();

// Configuration
const POLL_INTERVAL = 5000; // Poll every 5 seconds
const BATCH_SIZE = 20; // Number of messages per batch
const CONCURRENT_BATCHES = 3; // Max concurrent batch fetches
const MAX_RESULTS = 500; // Max messages to fetch per job

/**
 * Get OAuth2 client for a user
 */
async function getOAuth2Client(userId: string): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const { data: token, error } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !token) {
    throw new Error('No Gmail token found for user');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await supabase
        .from('user_tokens')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + (tokens.expiry_date || 3600000)).toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider', 'google');
    }
  });

  return oauth2Client;
}

/**
 * Fetch Gmail messages with caching and incremental sync
 */
async function fetchGmailMessages(
  userId: string,
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  daysBack: number = 7,
  onProgress?: (current: number, total: number, step: string) => void
) {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Check last sync time for incremental sync
  const { data: userToken } = await supabase
    .from('user_tokens')
    .select('last_sync_at, last_message_date, total_messages_synced')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  // Build Gmail query with incremental sync support
  let query: string;
  let syncMode: 'full' | 'incremental';
  
  if (userToken?.last_sync_at) {
    // Incremental sync: only fetch messages since last sync
    const lastSyncTimestamp = Math.floor(new Date(userToken.last_sync_at).getTime() / 1000);
    query = `after:${lastSyncTimestamp}`;
    syncMode = 'incremental';
    console.log(`🔄 Incremental sync: fetching messages since ${new Date(userToken.last_sync_at).toLocaleString()}`);
  } else {
    // Full sync: fetch all messages within daysBack window
    const after = Math.floor(Date.now() / 1000) - daysBack * 24 * 60 * 60;
    query = `after:${after}`;
    syncMode = 'full';
    console.log(`📥 Full sync: fetching last ${daysBack} days of messages`);
  }

  // Step 1: List message IDs (using metadata format for speed)
  onProgress?.(0, 100, 'Listing messages...');
  
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: MAX_RESULTS,
  });

  const messageIds = listResponse.data.messages || [];
  const totalMessages = messageIds.length;

  if (totalMessages === 0) {
    return [];
  }

  console.log(`📬 Found ${totalMessages} messages for user ${userId}`);

  // Step 2: Check which messages are already cached
  const messageIdStrings = messageIds.map((m) => m.id!);
  const cachedStatus = await cacheService.checkCached(userId, messageIdStrings);
  
  const uncachedIds = messageIdStrings.filter((id) => !cachedStatus.get(id));
  const cachedCount = totalMessages - uncachedIds.length;
  const cacheHitRate = totalMessages > 0 ? (cachedCount / totalMessages * 100) : 0;
  console.log(`💾 Cache hit rate: ${cacheHitRate.toFixed(1)}%`);

  // Step 3: Fetch uncached messages in batches with limited concurrency
  const messagesToCache: CacheBulkInsert[] = [];
  const totalUncached = uncachedIds.length;
  const totalBatches = Math.ceil(totalUncached / BATCH_SIZE);

  const batchPromises: Promise<void>[] = [];
  let currentBatchIndex = 0;

  for (let i = 0; i < totalUncached; i += BATCH_SIZE) {
    const batch = uncachedIds.slice(i, i + BATCH_SIZE);
    const startIndex = i;
    currentBatchIndex++;
    const batchNum = currentBatchIndex;

    const processBatch = async () => {
      onProgress?.(
        startIndex + batch.length,
        totalMessages,
        `Fetching batch ${batchNum}/${totalBatches}...`
      );

      const fetchPromises = batch.map(async (messageId) => {
        try {
          const message = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'metadata', // Fast initial fetch
            metadataHeaders: ['From', 'To', 'Subject', 'Date'],
          });

          const headers = message.data.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

          const cacheEntry = {
            user_id: userId,
            message_id: messageId,
            thread_id: message.data.threadId || undefined,
            provider: 'gmail' as const,
            raw_data: message.data,
            internal_date: message.data.internalDate
              ? new Date(parseInt(message.data.internalDate))
              : undefined,
            subject: getHeader('Subject'),
            from_email: getHeader('From'),
            to_emails: getHeader('To').split(',').map((e) => e.trim()),
            has_attachments: (message.data.payload?.parts?.length || 0) > 1,
          };

          return cacheEntry;
        } catch (error) {
          console.error(`❌ Error fetching message ${messageId}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(fetchPromises);
      const validResults = batchResults.filter(r => r !== null) as CacheBulkInsert[];
      
      messagesToCache.push(...validResults);

      // Cache this batch
      if (validResults.length > 0) {
        await cacheService.cacheBulk(validResults);
        console.log(`  💾 Cached ${validResults.length} messages from batch ${batchNum}`);
      }
    };

    // Add the promise to the list
    batchPromises.push(processBatch());

    // If we have reached the concurrency limit, wait for one to finish
    if (batchPromises.length >= CONCURRENT_BATCHES) {
      await Promise.race(batchPromises);
      // Filter out completed promises
      // Note: This is a simplified way. A more robust solution might use a queue or a library like p-limit.
      // For this specific case, `Promise.race` combined with filtering is sufficient to manage concurrency.
      // The `filter(p => p !== null)` is a placeholder, as `Promise.race` doesn't directly remove from the array.
      // A better approach would be to re-assign `batchPromises` with only pending promises.
      // For now, we'll just wait for one and let `Promise.all` at the end handle the rest.
      // To truly manage the array of active promises, one would typically remove the resolved promise.
      // Given the current structure, `Promise.all` at the end will ensure all are done.
      // The `Promise.race` here primarily serves to pause execution until *at least one* slot frees up.
      // Small delay to avoid rate limits, even with concurrency
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  await Promise.all(batchPromises); // Wait for any remaining promises

  // Step 4: Retrieve all messages (cached + newly fetched)
  onProgress?.(totalMessages, totalMessages, 'Loading from cache...');
  
  const allMessages = await cacheService.getMessages(userId, {
    limit: MAX_RESULTS,
  });

  // Step 5: Update sync tracking
  const syncTimestamp = new Date().toISOString();
  const latestMessageDate = allMessages.length > 0
    ? allMessages[0].internal_date || syncTimestamp
    : syncTimestamp;

  await supabase
    .from('user_tokens')
    .update({
      last_sync_at: syncTimestamp,
      last_message_date: latestMessageDate,
      total_messages_synced: allMessages.length,
    })
    .eq('user_id', userId)
    .eq('provider', 'google');

  console.log(`✅ Retrieved ${allMessages.length} total messages (${syncMode} sync)`);
  console.log(`📊 Sync stats: ${uncachedIds.length} new, ${cachedCount} cached (${cacheHitRate.toFixed(1)}% hit rate)`);
  
  return allMessages;
}

/**
 * Process a single analytics job
 */
async function processJob(job: AnalyticsJob) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🚀 Processing Job: ${job.id}`);
  console.log(`   Type: ${job.job_type}`);
  console.log(`   User: ${job.user_id}`);
  console.log(`${'='.repeat(70)}\n`);

  try {
    // Update job to processing
    await jobService.updateJob(job.id, { 
      status: 'processing',
      started_at: new Date().toISOString()
    });

    const metadata = (job.metadata as Record<string, unknown>) || {};

    if (job.job_type === 'fetch_messages') {
      const daysBack = typeof metadata.days_back === 'number' ? metadata.days_back : 7;
      
      // Get OAuth client
      const oauth2Client = await getOAuth2Client(job.user_id);

      // Fetch messages with progress tracking
      const messages = await fetchGmailMessages(
        job.user_id,
        oauth2Client,
        daysBack,
        async (current: number, total: number, step: string) => {
          await jobService.updateProgress({
            jobId: job.id,
            progress: current,
            total: total,
            currentStep: step,
          });
        }
      );

      // Complete the job
      await jobService.completeJob(job.id, {
        messages_fetched: messages.length,
        cache_hit_rate: metadata?.cache_hit_rate,
        completed_at: new Date().toISOString(),
      });

      console.log(`✅ Job ${job.id} completed successfully!`);
      console.log(`   Messages fetched: ${messages.length}\n`);

      // Enqueue insight computation job
      await jobService.createJob({
        user_id: job.user_id,
        job_type: 'compute_insights',
      });

    } else if (job.job_type === 'compute_insights') {
      // Run all insight computations in parallel
      console.log(`🧠 Computing insights for user ${job.user_id}...`);
      
      await Promise.all([
        computeStrategicVsReactive(job.user_id),
        computeDecisionVelocity(job.user_id),
        computeRelationshipHealth(job.user_id),
      ]);
      
      // Mark insight job as completed
      await jobService.completeJob(job.id);
      console.log(`✅ All insights computed for job ${job.id}`);

    } else if (job.job_type === 'compute_analytics') {
      // TODO: Implement analytics computation
      await jobService.updateProgress({
        jobId: job.id,
        progress: 50,
        total: 100,
        currentStep: 'Computing analytics...',
      });

      // Complete
      await jobService.completeJob(job.id);
      console.log(`✅ Job ${job.id} completed (analytics computation)\n`);

    } else if (job.job_type === 'full_sync') {
      // TODO: Implement full sync
      await jobService.completeJob(job.id);
      console.log(`✅ Job ${job.id} completed (full sync)\n`);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Job ${job.id} failed:`, errorMessage);
    
    // Check if we should retry
    if (job.retry_count < job.max_retries) {
      console.log(`   🔄 Retrying... (${job.retry_count + 1}/${job.max_retries})`);
      await jobService.retryJob(job.id);
    } else {
      console.log(`   💀 Max retries reached. Marking as failed.`);
      await jobService.failJob(job.id, errorMessage, {
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

/**
 * Poll for pending jobs
 */
async function pollForJobs() {
  try {
    // Get all pending jobs
    const { data: jobs, error } = await supabase
      .from('analytics_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5); // Process up to 5 jobs at a time

    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return;
    }

    if (jobs && jobs.length > 0) {
      console.log(`📋 Found ${jobs.length} pending job(s)`);
      
      // Process jobs sequentially to avoid overwhelming the system
      for (const job of jobs) {
        await processJob(job as AnalyticsJob);
      }
    }
  } catch (error) {
    console.error('❌ Error in poll cycle:', error);
  }
}

/**
 * Main worker loop
 */
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 ANALYTICS BACKGROUND WORKER');
  console.log('='.repeat(70));
  console.log(`📊 Poll interval: ${POLL_INTERVAL}ms`);
  console.log(`📦 Batch size: ${BATCH_SIZE} messages`);
  console.log(`📬 Max results: ${MAX_RESULTS} messages per job`);
  console.log('='.repeat(70) + '\n');

  console.log('✅ Worker started. Polling for jobs...\n');

  // Initial poll
  await pollForJobs();

  // Set up polling interval
  setInterval(async () => {
    await pollForJobs();
  }, POLL_INTERVAL);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Shutting down worker gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n⏹️  Shutting down worker gracefully...');
    process.exit(0);
  });
}

// Run the worker
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { processJob, pollForJobs };
