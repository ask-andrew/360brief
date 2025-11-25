# 360Brief Analytics Performance Improvements - Implementation Summary

## ✅ Completed: Phase 1.1 - Background Processing Infrastructure

### What We Built

#### 1. Database Schema ✓

**File**: `/supabase/migrations/20251120_analytics_background_processing.sql`

Created three core tables:

- **`analytics_jobs`**: Tracks background jobs for async processing
  - Job status tracking (pending → processing → completed/failed)
  - Progress monitoring (current/total with percentage)
  - Retry logic (configurable max retries)
  - Metadata storage for job configuration
- **`message_cache`**: Caches Gmail messages to reduce API calls
  - Stores raw Gmail API responses
  - Stores processed/normalized data
  - Two-tier storage for flexibility
  - Unique constraint per user/message/provider
- **`analytics_cache`**: Stores computed analytics results
  - TTL-based expiration
  - Hit count tracking
  - Cache key organization

**Key Features:**

- Proper indexes for performance
- Row-Level Security (RLS) policies
- Auto-updating timestamps
- Cleanup functions for old data
- Comprehensive documentation

#### 2. TypeScript Types ✓

**File**: `/types/analytics-jobs.ts`

- Complete type definitions for all database tables
- Helper utilities (`JobStatusHelpers`, `CacheKeys`)
- Well-documented interfaces
- Type-safe job creation and updates

#### 3. Job Service ✓

**File**: `/src/services/analytics/jobService.ts`

Full-featured service for managing analytics jobs:

- ✓ Create jobs with validation
- ✓ Get job status and progress
- ✓ Update job progress incrementally
- ✓ Complete/fail jobs
- ✓ Retry failed jobs
- ✓ Check for running jobs (prevent duplicates)
- ✓ Cleanup old jobs
- ✓ Comprehensive error handling

**Key Methods:**

```typescript
- createJob(request): Create new job
- getJob(jobId): Get job by ID
- getUserJobs(userId, options): List user's jobs
- updateProgress(update): Update job progress
- completeJob(jobId): Mark job as completed
- failJob(jobId, error): Mark job as failed
- retryJob(jobId): Retry a failed job
- hasRunningJob(userId): Check for duplicates
```

#### 4. Message Cache Service ✓

**File**: `/src/services/analytics/messageCacheService.ts`

Comprehensive caching service:

- ✓ Cache single/bulk messages
- ✓ Retrieve cached messages with filters
- ✓ Check cache status for message IDs
- ✓ Get cache statistics
- ✓ Update processed data
- ✓ Clean up old messages
- ✓ Thread-based queries

**Key Methods:**

```typescript
- cacheMessage(message): Cache single message
- cacheBulk(messages): Bulk insert
- getMessage(userId, messageId): Get cached message
- getMessages(userId, options): Query with filters
- checkCached(userId, messageIds): Check cache status
- getCacheStats(userId): Get statistics
- clearCache(userId): Clear user's cache
```

#### 5. API Endpoints ✓

**Files**:

- `/app/api/analytics/jobs/route.ts`
- `/app/api/analytics/jobs/[id]/route.ts`

RESTful API for job management:

- **POST** `/api/analytics/jobs` - Create new job
  - Validates job type
  - Prevents duplicate jobs
  - Returns job object
- **GET** `/api/analytics/jobs` - List jobs
  - Filter by status, type
  - Pagination support
  - User authentication
- **GET** `/api/analytics/jobs/[id]` - Get job status
  - Real-time progress
  - Percentage calculation
  - Ownership verification
- **PATCH** `/api/analytics/jobs/[id]` - Update job (workers)
  - For background processors
  - Service role authentication
- **DELETE** `/api/analytics/jobs/[id]` - Cancel job
  - User authorization
  - Safe deletion

---

## 📋 Next Steps

### Immediate Next Steps (This Week)

#### 1. Run the Migration

```bash
# Apply the migration to your Supabase database
# Option A: Through Supabase Dashboard
# - Go to Database > Migrations
# - Run the migration file

# Option B: Using Supabase CLI
cd /Users/andrewledet/CascadeProjects/360brief
supabase db push
```

#### 2. Test the Infrastructure

Create a test to verify the setup works:

```typescript
// Test file: tests/analytics-jobs.test.ts
import { getJobService } from "@/services/analytics/jobService";
import { getMessageCacheService } from "@/services/analytics/messageCacheService";

test("Create and track analytics job", async () => {
  const jobService = getJobService();

  // Create job
  const job = await jobService.createJob({
    user_id: "test-user-id",
    job_type: "fetch_messages",
    metadata: { days_back: 7 },
  });

  expect(job.status).toBe("pending");

  // Update progress
  await jobService.updateProgress({
    jobId: job.id,
    progress: 50,
    total: 100,
    currentStep: "Fetching messages...",
  });

  // Complete job
  const completed = await jobService.completeJob(job.id);
  expect(completed.status).toBe("completed");
});
```

#### 3. Implement Background Worker

Choose one of these approaches:

**Option A: Simple Node.js Worker (Recommended for MVP)**

```typescript
// workers/analyticsWorker.ts
import { getJobService } from "@/services/analytics/jobService";
import { getMessageCacheService } from "@/services/analytics/messageCacheService";
import { fetchGmailMessages } from "@/services/analytics/gmail";

async function processJob(jobId: string) {
  const jobService = getJobService();
  const cacheService = getMessageCacheService();

  const job = await jobService.getJob(jobId);
  if (!job) return;

  try {
    await jobService.updateJob(jobId, { status: "processing" });

    // Fetch messages in batches
    const batchSize = 20;
    let processed = 0;

    // Your Gmail fetching logic here
    // ...

    await jobService.completeJob(jobId);
  } catch (error) {
    await jobService.failJob(jobId, error.message);
  }
}

// Poll for pending jobs every 5 seconds
setInterval(async () => {
  const jobs = await jobService.getUserJobs("all", {
    status: "pending",
    limit: 1,
  });

  if (jobs.length > 0) {
    await processJob(jobs[0].id);
  }
}, 5000);
```

**Option B: Use Inngest (Recommended for Production)**

```bash
npm install inngest
```

**Option C: Use Vercel Background Functions**

```typescript
// app/api/jobs/process/route.ts
export const maxDuration = 300; // 5 minutes
```

#### 4. Update Analytics Route

Modify `/app/api/analytics/route.ts` to use background jobs:

```typescript
// Instead of fetching immediately:
// const messages = await fetchGmailMessages(oauth2Client, daysBack);

// Create a background job:
const job = await jobService.createJob({
  user_id: user.id,
  job_type: "fetch_messages",
  metadata: { days_back: daysBack },
});

// Return immediately with job ID
return NextResponse.json(
  {
    status: "processing",
    job_id: job.id,
    message: "Analytics processing started",
  },
  { status: 202 }
);
```

#### 5. Create Progress UI Component

Add a progress tracker to the dashboard:

```typescript
// src/components/analytics/ProgressTracker.tsx
import { useQuery } from '@tanstack/react-query';

export function ProgressTracker({ jobId }: { jobId: string }) {
  const { data: job } = useQuery({
    queryKey: ['analytics-job', jobId],
    queryFn: () => fetch(`/api/analytics/jobs/${jobId}`).then(r => r.json()),
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!jobId,
  });

  const percentage = job?.progress?.percentage || 0;

  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${percentage}%` }} />
      </div>
      <p>{job?.progress?.current_step || 'Processing...'}</p>
      <p>{job?.progress?.current} / {job?.progress?.total}</p>
    </div>
  );
}
```

---

### Week 1 Remaining Tasks

- [ ] Run database migration
- [ ] Write unit tests for JobService
- [ ] Write unit tests for MessageCacheService
- [ ] Implement basic background worker
- [ ] Update analytics route to create jobs
- [ ] Add progress tracking UI
- [ ] Test end-to-end flow

### Week 2: Phase 1.2 - Optimized Message Fetching

- [ ] Implement metadata-first fetching
- [ ] Add pagination with cursor
- [ ] Selective full-format fetching
- [ ] Integrate with message cache
- [ ] Performance testing

### Week 3: Phase 1.3 - Enhanced Caching

- [ ] Implement stale-while-revalidate
- [ ] Add cache warming
- [ ] Database-backed persistence
- [ ] Cache metrics and monitoring

---

## 🎯 Success Metrics to Track

### Performance

- Job creation time: < 100ms
- Cache hit rate: Target 70%+
- Message fetch time: < 3 seconds per 20 messages
- Database query time: < 50ms average

### Reliability

- Job success rate: > 95%
- Retry success rate: > 80%
- Cache consistency: 100%

### User Experience

- Time to first data: < 3 seconds
- Progress update frequency: Every 2 seconds
- Error message clarity: User-friendly

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js)                    │
│  ┌──────────────────────────────────────────┐   │
│  │  ModernAnalyticsDashboard.tsx            │   │
│  │  - ProgressTracker Component             │   │
│  │  - Real-time job status polling          │   │
│  └──────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────────────┐
│           API Routes                            │
│  ┌──────────────────────────────────────────┐   │
│  │  POST /api/analytics/jobs                │   │
│  │  GET  /api/analytics/jobs/:id            │   │
│  │  GET  /api/analytics (with job support)  │   │
│  └──────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           Services Layer                        │
│  ┌──────────────────┐  ┌────────────────────┐   │
│  │  JobService      │  │ MessageCacheService│   │
│  │  - createJob     │  │ - cacheBulk        │   │
│  │  - updateProgress│  │ - getMessages      │   │
│  │  - completeJob   │  │ - checkCached      │   │
│  └──────────────────┘  └────────────────────┘   │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           Database (Supabase)                   │
│  ┌──────────────────────────────────────────┐   │
│  │  analytics_jobs                          │   │
│  │  message_cache                           │   │
│  │  analytics_cache                         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                 ▲
                 │
┌────────────────┴────────────────────────────────┐
│           Background Worker                     │
│  - Polls for pending jobs                       │
│  - Fetches Gmail messages                       │
│  - Updates progress                             │
│  - Stores in cache                              │
│  - Computes analytics                           │
└─────────────────────────────────────────────────┘
```

---

## 📝 Implementation Notes

### Design Decisions

1. **Two-Tier Message Storage**
   - `raw_data`: Full Gmail API response (for debugging/reprocessing)
   - `processed_data`: Normalized format (for fast analytics)

2. **Job Status Flow**

   ```
   pending → processing → completed
                       → failed (can retry)
   ```

3. **Cache Strategy**
   - Message-level caching (dedupe API calls)
   - Analytics result caching (instant load)
   - TTL-based expiration
   - Hit count tracking for optimization

4. **RLS Policies**
   - Users can only see their own jobs/cache
   - Service role can update any job (for workers)
   - Secure by default

### Common Pitfalls to Avoid

1. **Don't fetch all messages at once** - Use pagination
2. **Don't skip the cache check** - Always check before fetching
3. **Don't forget to update progress** - Users need feedback
4. **Don't retry forever** - Respect max_retries
5. **Don't expose raw errors to users** - Provide friendly messages

---

## 🚀 Ready to Deploy?

Checklist before going live:

- [ ] Migration applied successfully
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing
- [ ] E2E test for job creation → completion
- [ ] Background worker running
- [ ] Monitoring/logging in place
- [ ] Error tracking configured (Sentry?)
- [ ] Performance baselines established
- [ ] Feature flag ready (for gradual rollout)

---

## 📚 Resources

- [Implementation Plan](/.gemini/workflows/performance-improvements-implementation-plan.md)
- [Database Migration](/supabase/migrations/20251120_analytics_background_processing.sql)
- [TypeScript Types](/types/analytics-jobs.ts)
- [Job Service](/src/services/analytics/jobService.ts)
- [Message Cache Service](/src/services/analytics/messageCacheService.ts)
- [API Endpoints](/app/api/analytics/jobs/)

---

**Questions or issues?** Refer back to the implementation plan or check the inline documentation in each file.
