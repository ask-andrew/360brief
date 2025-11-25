---
description: Implementation plan for Level 10 Analytics System
---

# Level 10 Analytics Implementation Plan

## Overview

Building a differentiated analytics system with 18 advanced metrics across 6 themes, following TDD principles and incremental development.

## Architecture Layers

### Layer 1: Raw Data (Immutable)

- `emails_raw` - Unprocessed email data from Gmail API
- `calendar_raw` - Unprocessed calendar events
- `slack_raw` - Future: Slack messages

### Layer 2: Processed Data (Normalized)

- `email_threads` - Email threading logic applied
- `participants` - Unified contact records
- `events_timeline` - Chronological stream of all events
- `relationships` - Contact-to-contact mapping

### Layer 3: Enriched Data (LLM-enhanced)

- `content_classifications` - Topics, intents, sentiment
- `action_items` - Extracted action items
- `decisions` - Extracted decisions

### Layer 4: Metrics (Calculated)

- `daily_metrics` - Daily aggregated metrics
- `weekly_metrics` - Weekly aggregated metrics
- `historical_trends` - Long-term trends

## Implementation Phases

### Phase 1: Foundation (Week 1) ✅ CURRENT PHASE

**Goal:** Build the data processing pipeline foundation

1. **Database Schema**
   - Create tables for 4-layer architecture
   - Add indexes for performance
   - Set up migrations

2. **Thread Reconstruction**
   - Implement Message-ID based threading
   - Handle In-Reply-To and References headers
   - Subject-based fallback threading
   - Gmail threading compatibility

3. **Contact Normalization**
   - Unified contact records
   - Email address deduplication
   - Name standardization
   - Domain grouping

4. **Timeline Creation**
   - Chronological event stream
   - Merge emails and calendar events
   - Timezone normalization

### Phase 2: Simple Metrics (Week 2)

**Goal:** Implement first 4 metrics without LLM dependency

5. **Response Time Reciprocity**
   - Calculate user vs contact response times
   - Handle edge cases (automated responses, abandoned threads)
   - Use median instead of mean
   - Working hours calculation

6. **Thread Decay Rate**
   - Identify thread endings
   - Calculate decay by contact/domain
   - Trend analysis

7. **Weekend/Evening Creep Index**
   - Track out-of-hours activity
   - Trend over time
   - Burnout risk flagging

8. **Reactive vs Proactive Ratio**
   - Thread initiation tracking
   - Ratio calculation
   - Trend visualization

### Phase 3: Advanced Metrics (Week 3)

**Goal:** Implement metrics requiring basic NLP

9. **Context Switch Tax**
   - Keyword-based context classification
   - Chronological event sequencing
   - Switch counting

10. **Meeting ROI Score**
    - Action item extraction
    - Decision extraction
    - Cost calculation (duration × attendees)

11. **Communication Equity Index**
    - Direct report tracking
    - Time allocation measurement
    - Variance calculation

12. **Collaboration Temperature Map**
    - Multi-factor scoring
    - Trend detection
    - Warming/cooling identification

### Phase 4: LLM-Enhanced Metrics (Week 4)

**Goal:** Implement metrics requiring advanced LLM analysis

13. **Delegation vs Execution Ratio**
    - Verb pattern detection
    - Sentence classification
    - Ratio tracking

14. **Strategic Focus Alignment**
    - Priority keyword mapping
    - Time allocation tracking
    - Misalignment scoring

15. **Energy Signature Pattern**
    - Multi-factor energy scoring
    - Daily curve generation
    - Peak/trough identification

16. **Peak Cognitive Load Windows**
    - Load score calculation
    - Heatmap generation
    - Pattern identification

17. **Connector Score**
    - Introduction pattern detection
    - Network graph building
    - Score calculation

18. **Information Bottleneck Index**
    - Group mapping
    - Flow analysis
    - Bottleneck detection

## Technical Stack

### Database

- PostgreSQL: Raw + processed data
- Existing Supabase tables extended

### Processing

- TypeScript: Data pipeline
- Node.js: Background jobs
- Existing pg-boss queue

### LLM

- Tiered approach:
  - Tier 1: Keyword matching (free, instant)
  - Tier 2: Simple regex/NLP (cheap, fast)
  - Tier 3: OpenAI GPT-4 (expensive, accurate)

### Caching

- Redis or in-memory cache for metrics
- Incremental processing to avoid recomputation

## Testing Strategy

### Unit Tests

- Thread reconstruction logic
- Contact normalization
- Metric calculations
- Edge case handling

### Integration Tests

- Database operations
- API integrations
- Background job processing

### E2E Tests

- Full pipeline execution
- Dashboard data flow

## Current Status

**Completed:**

- ✅ Gmail OAuth integration
- ✅ Email fetching from Gmail API
- ✅ Basic analytics dashboard UI
- ✅ Background job system (pg-boss)
- ✅ Sentiment analysis foundation

**In Progress:**

- 🔄 Phase 1: Foundation layer

**Next Steps:**

1. Create database schema for 4-layer architecture
2. Implement thread reconstruction
3. Build contact normalization
4. Create timeline builder
5. Write tests for each component

## Success Metrics

- All 18 metrics implemented and tested
- Dashboard displays real-time insights
- LLM recommendations generated
- Performance: metrics calculated in < 5 seconds
- Cost: LLM usage optimized with tiered approach
