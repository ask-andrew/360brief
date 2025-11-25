---
description: Performance & UX Improvements Implementation Plan
---

# 360Brief Analytics Performance & UX Improvements

**Implementation Plan following TDD Methodology**

## Overview

This plan implements performance optimizations, UX improvements, and features for the 360Brief analytics platform following a Test-Driven Development (TDD) approach with Red-Green-Refactor cycles.

---

## Phase 1: HIGH PRIORITY - Performance Optimizations

### 1.1 Background Processing Infrastructure

**Goal**: Implement async job processing for Gmail message fetching and caching

#### Database Schema (TDD Step 1: Red - Write Failing Tests)

- [ ] **Test**: Create migration test for `analytics_jobs` table
- [ ] **Test**: Create migration test for `message_cache` table
- [ ] **Green**: Implement migration

  ```sql
  CREATE TABLE analytics_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    job_type TEXT CHECK (job_type IN ('fetch_messages', 'compute_analytics')),
    progress INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  );

  CREATE TABLE message_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    provider TEXT DEFAULT 'gmail',
    raw_data JSONB NOT NULL,
    processed_data JSONB,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, message_id, provider)
  );

  CREATE INDEX idx_analytics_jobs_user_status ON analytics_jobs(user_id, status);
  CREATE INDEX idx_message_cache_user_fetched ON message_cache(user_id, fetched_at DESC);
  ```

- [ ] **Refactor**: Add indexes and optimize queries

#### Background Job Service (TDD Step 2)

- [ ] **Test**: Write tests for `AnalyticsJobService.createJob()`
- [ ] **Test**: Write tests for `AnalyticsJobService.updateProgress()`
- [ ] **Test**: Write tests for `AnalyticsJobService.getJobStatus()`
- [ ] **Green**: Implement `/src/services/analytics/jobService.ts`
- [ ] **Refactor**: Extract common patterns, add error handling

#### Message Fetching with Caching (TDD Step 3)

- [ ] **Test**: Write tests for fetching messages in batches (20 at a time)
- [ ] **Test**: Write tests for cache hit/miss scenarios
- [ ] **Test**: Write tests for partial data availability
- [ ] **Green**: Implement `/src/services/analytics/messageFetcher.ts`
  - Fetch metadata format first (fast)
  - Store in `message_cache` table
  - Only fetch full format for sentiment analysis
  - Implement pagination (20 messages/batch)
- [ ] **Refactor**: Optimize batch sizes, add retry logic

#### API Endpoints (TDD Step 4)

- [ ] **Test**: Write E2E tests for `/api/analytics/jobs` POST (create job)
- [ ] **Test**: Write E2E tests for `/api/analytics/jobs/[id]` GET (status polling)
- [ ] **Green**: Implement job creation and status endpoints
- [ ] **Refactor**: Add rate limiting, validation

---

### 1.2 Optimize Message Fetching

**Goal**: Use metadata format for initial list, full format only when needed

#### Gmail Service Optimization (TDD)

- [ ] **Test**: Write tests for `fetchGmailMessagesOptimized()` using metadata format
- [ ] **Test**: Write tests for selective full-format fetching
- [ ] **Test**: Write tests for pagination with cursor
- [ ] **Green**: Update `/src/services/analytics/gmail.ts`

  ```typescript
  // Fetch list with metadata (fast)
  const messages = await gmail.users.messages.list({
    userId: "me",
    maxResults: 20,
    format: "metadata",
  });

  // Only fetch full for sentiment analysis candidates
  const fullMessages = await Promise.all(
    priorityMessages.map((msg) =>
      gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      })
    )
  );
  ```

- [ ] **Refactor**: Extract batch processing logic, optimize network calls

---

### 1.3 Caching Layer

**Goal**: Cache analytics results for 5-15 minutes with background refresh

#### Cache Service Enhancement (TDD)

- [ ] **Test**: Write tests for TTL-based cache expiration
- [ ] **Test**: Write tests for background refresh mechanism
- [ ] **Test**: Write tests for cache invalidation
- [ ] **Green**: Enhance `/src/services/analytics/cache.ts`
  - Implement Redis-like in-memory cache with TTL
  - Add database-backed cache for persistence
  - Implement stale-while-revalidate pattern
- [ ] **Refactor**: Add cache warming, optimize memory usage

#### Analytics Route Update (TDD)

- [ ] **Test**: Write tests for cache hit returns < 1 second
- [ ] **Test**: Write tests for background refresh trigger
- [ ] **Green**: Update `/app/api/analytics/route.ts`
  - Check cache first
  - Return cached data immediately if fresh
  - Trigger background job if stale
  - Return stale data with refresh indicator
- [ ] **Refactor**: Add cache metrics, logging

---

## Phase 2: MEDIUM PRIORITY - UX Improvements

### 2.1 Single Sign-On Flow

**Goal**: Combine initial auth + Gmail connection into one step

#### OAuth Flow Integration (TDD)

- [ ] **Test**: Write E2E test for unified OAuth flow
- [ ] **Test**: Write test for automatic Gmail connection after auth
- [ ] **Green**: Update `/app/api/auth/gmail/callback/route.ts`
  - After Google OAuth, check if Gmail already connected
  - If not, automatically trigger Gmail scope addition
  - Store combined tokens in single transaction
- [ ] **Refactor**: Simplify error handling, add fallback flows

---

### 2.2 Progressive Loading

**Goal**: Show data as it arrives with progress indicators

#### Real-time Progress Component (TDD)

- [ ] **Test**: Write component tests for `ProgressTracker`
- [ ] **Test**: Write tests for progress updates via polling
- [ ] **Green**: Create `/src/components/analytics/ProgressTracker.tsx`

  ```typescript
  interface ProgressState {
    processed: number;
    total: number;
    status: "idle" | "processing" | "complete" | "error";
    currentStep: string;
  }

  // Poll job status every 2 seconds
  const { data: progress } = useQuery({
    queryKey: ["analytics-progress", jobId],
    queryFn: () => fetch(`/api/analytics/jobs/${jobId}`),
    refetchInterval: 2000,
    enabled: status === "processing",
  });
  ```

- [ ] **Refactor**: Add animations, optimize polling

#### Streaming Analytics Display (TDD)

- [ ] **Test**: Write tests for incremental tile updates
- [ ] **Test**: Write tests for partial data rendering
- [ ] **Green**: Update `ModernAnalyticsDashboard.tsx`
  - Display "Analyzing 45/200 messages..." indicator
  - Update sentiment tiles as data arrives
  - Show skeleton loading for pending sections
- [ ] **Refactor**: Add smooth transitions, loading states

---

### 2.3 AI Insights Fix

**Goal**: Debug why AI insights aren't showing

#### Diagnostic Phase (TDD)

- [ ] **Test**: Write integration tests for Gemini API connection
- [ ] **Test**: Write integration tests for Mistral API connection
- [ ] **Test**: Write tests for fallback to rule-based insights
- [ ] **Green**: Create `/app/api/analytics/ai-insights/route.ts`
  - Test Gemini API key validity
  - Test Mistral API key validity
  - Implement API call with proper error handling
  - Add comprehensive logging
- [ ] **Refactor**: Add retry logic, circuit breaker pattern

#### Fallback Implementation (TDD)

- [ ] **Test**: Write tests for rule-based insights generation
- [ ] **Green**: Implement `/src/services/analytics/ruleBasedInsights.ts`
  ```typescript
  // Generate insights from patterns without AI
  function generateRuleBasedInsights(data: AnalyticsData): Insight[] {
    const insights = [];

    // High email volume insight
    if (data.total_count > 200) {
      insights.push({
        type: "alert",
        title: "High Email Volume",
        description: `You received ${data.total_count} emails. Consider batching responses.`,
      });
    }

    // Response time insight
    if (data.avg_response_time_minutes > 120) {
      insights.push({
        type: "warning",
        title: "Slow Response Time",
        description:
          "Average response time is over 2 hours. Priority messages may need attention.",
      });
    }

    return insights;
  }
  ```
- [ ] **Refactor**: Add more sophisticated pattern detection

---

## Phase 3: LOW PRIORITY - Feature Enrichment

### 3.1 Enhanced Analytics Tiles

**Goal**: Add thread velocity, response patterns, meeting efficiency

#### Thread Velocity Analysis (TDD)

- [ ] **Test**: Write tests for thread velocity calculation
- [ ] **Test**: Write tests for thread lifecycle tracking
- [ ] **Green**: Implement `/src/services/analytics/threadAnalysis.ts`
  ```typescript
  interface ThreadMetrics {
    threadId: string;
    messageCount: number;
    participantCount: number;
    avgResponseTime: number;
    firstMessage: Date;
    lastMessage: Date;
    velocity: number; // messages per day
  }
  ```
- [ ] **Refactor**: Optimize thread grouping algorithms

#### Response Pattern Detection (TDD)

- [ ] **Test**: Write tests for response pattern identification
- [ ] **Test**: Write tests for time-of-day patterns
- [ ] **Green**: Implement response pattern analysis
  - Identify common response times
  - Detect business hours
  - Find response time trends
- [ ] **Refactor**: Add visualization helpers

#### Meeting Efficiency Metrics (TDD)

- [ ] **Test**: Write tests for meeting efficiency calculation
- [ ] **Test**: Write tests for meeting outcome detection
- [ ] **Green**: Implement meeting analytics
  - Calculate meeting time utilization
  - Detect unnecessary meetings (no follow-up)
  - Identify top meeting participants
- [ ] **Refactor**: Add calendar integration

---

### 3.2 Network Graph

**Goal**: Visualize collaboration patterns

#### Collaboration Network Builder (TDD)

- [ ] **Test**: Write tests for network graph data generation
- [ ] **Test**: Write tests for node/edge calculations
- [ ] **Green**: Implement `/src/services/analytics/networkGraph.ts`

  ```typescript
  interface NetworkNode {
    id: string;
    name: string;
    email: string;
    messageCount: number;
    centrality: number;
  }

  interface NetworkEdge {
    source: string;
    target: string;
    weight: number; // number of interactions
  }
  ```

- [ ] **Refactor**: Optimize graph algorithms

#### Visualization Component (TDD)

- [ ] **Test**: Write component tests for `CollaborationNetwork`
- [ ] **Green**: Create interactive network visualization using echarts
- [ ] **Refactor**: Add filtering, zoom, node details

---

### 3.3 Time Intelligence

**Goal**: Identify best times for focused work

#### Focus Time Analysis (TDD)

- [ ] **Test**: Write tests for quiet period detection
- [ ] **Test**: Write tests for interruption analysis
- [ ] **Green**: Implement `/src/services/analytics/timeIntelligence.ts`
  ```typescript
  interface FocusWindow {
    dayOfWeek: number;
    startHour: number;
    endHour: number;
    averageInterruptions: number;
    recommendedFor: "deep-work" | "meetings" | "email";
  }
  ```
- [ ] **Refactor**: Add ML-based prediction

---

## Testing Strategy

### Unit Tests (Base of Pyramid)

- All service functions must have unit tests
- Mock external dependencies (Gmail API, Supabase, AI APIs)
- Test edge cases and error conditions
- Target: 80%+ code coverage

### Integration Tests (Middle of Pyramid)

- Test database operations with test database
- Test API endpoints with real Supabase client
- Test job processing with actual queue
- Test cache operations with Redis/in-memory cache

### E2E Tests (Top of Pyramid)

- Test critical user flows:
  1. OAuth + Gmail connection
  2. Analytics page load with cached data (< 1s)
  3. Progressive loading of new analytics
  4. Error state handling
- Use Playwright for browser automation

---

## Implementation Order (Priority Queue)

### Week 1: Foundation

1. Database migrations (analytics_jobs, message_cache)
2. Background job service
3. Enhanced caching layer
4. Unit tests for core services

### Week 2: Performance

5. Optimized message fetching
6. Progressive loading UI
7. Job status polling
8. Integration tests

### Week 3: UX Polish

9. Single sign-on flow
10. AI insights debugging
11. Fallback insights
12. E2E tests

### Week 4: Features

13. Thread velocity
14. Network graph
15. Time intelligence
16. Performance optimization and polish

---

## Success Metrics

### Performance

- [ ] Analytics page loads in < 1 second (cached)
- [ ] First data appears in < 3 seconds (progressive)
- [ ] Background processing completes in < 60 seconds for 200 messages
- [ ] Cache hit rate > 70%

### UX

- [ ] Single-click OAuth flow
- [ ] Progress indicator shows during fetch
- [ ] AI insights appear or fallback is shown
- [ ] Error states are user-friendly

### Quality

- [ ] 80%+ code coverage
- [ ] All integration tests passing
- [ ] E2E tests for critical paths
- [ ] No TypeScript errors

---

## Risk Mitigation

### High Risk Areas

1. **Background Jobs**: May need queue system (BullMQ, Inngest)
2. **Caching**: Memory usage may grow, need eviction policy
3. **Progressive Loading**: State management complexity
4. **AI APIs**: External dependency, need circuit breaker

### Mitigation Strategies

- Feature flags for gradual rollout
- Comprehensive error logging
- Fallback mechanisms for all external services
- Performance monitoring and alerting
- Database connection pooling
- Rate limiting on API endpoints

---

## Next Steps

1. Review and approve this plan
2. Set up test infrastructure (if not existing)
3. Create feature branch: `feature/performance-improvements`
4. Start with Phase 1.1 (Background Processing Infrastructure)
5. Follow TDD Red-Green-Refactor for each task
6. Create PRs after completing each major section
7. Deploy behind feature flag
8. Monitor metrics and iterate
