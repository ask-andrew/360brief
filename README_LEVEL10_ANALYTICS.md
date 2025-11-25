# 🚀 Level 10 Analytics System

## Overview

A differentiated analytics system with **18 advanced metrics** across 6 themes that provides strategic intelligence, not just basic stats.

**What makes this "Level 10"?**

- ✅ **Actionable** - Every metric has clear "so what" and "now what"
- ✅ **Predictive** - Identifies problems before they explode
- ✅ **Behavioral** - Focuses on patterns, not just counts
- ✅ **Relational** - Understands dynamics between people
- ✅ **Strategic** - Connects day-to-day actions to business outcomes

## 📊 The 18 Metrics

### Theme 1: Relationship Velocity & Health

1. **Response Time Reciprocity** - How quickly you respond vs. how quickly they respond
2. **Thread Decay Rate** - Who ends conversations (you or them)?
3. **Collaboration Temperature** - Is the relationship warming or cooling?

### Theme 2: Attention Economics

4. **Peak Cognitive Load Windows** - When are you most overwhelmed?
5. **Context Switch Tax** - How fragmented is your day?
6. **Reply Debt Accumulation** - Where are obligations piling up?

### Theme 3: Leadership Patterns

7. **Delegation vs Execution Ratio** - Are you doing or delegating?
8. **Meeting ROI Score** - Which meetings generate value?
9. **Communication Equity** - Are you giving equal attention to your team?

### Theme 4: Strategic Focus

10. **Time vs Priority Misalignment** - Does your time match your stated priorities?
11. **Reactive vs Proactive Ratio** - Are you driving or responding?
12. **Firefighting Trend** - Are you in crisis mode or strategic mode?

### Theme 5: Personal Sustainability

13. **Weekend/Evening Creep** - Burnout risk indicator
14. **Focus Time vs Collaborative Time** - Do you have time to think?
15. **Energy Signature Pattern** - When are you most effective?

### Theme 6: Network Intelligence

16. **Connector Score** - How often do you introduce people?
17. **Information Bottleneck** - Are you a single point of failure?
18. **Influence Ripple Effect** - How much activity do your messages generate?

## 🏗️ Architecture

### 4-Layer Data Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: METRICS (Pre-calculated)                          │
│ ├─ daily_metrics                                           │
│ ├─ weekly_metrics                                          │
│ └─ historical_trends                                       │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: ENRICHED DATA (LLM-enhanced)                      │
│ ├─ content_classifications (topics, intent, sentiment)    │
│ ├─ action_items                                            │
│ └─ decisions                                               │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: PROCESSED DATA (Normalized)                       │
│ ├─ email_threads (reconstructed with threading logic)     │
│ ├─ thread_messages (sequence + response times)            │
│ ├─ participants (unified contact records)                 │
│ ├─ events_timeline (chronological stream)                 │
│ └─ relationships (contact-to-contact mapping)             │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: RAW DATA (Immutable)                              │
│ └─ message_cache (Gmail API responses)                     │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**

- 🔄 Incremental processing (don't reprocess everything)
- 🐛 Easy debugging (trace back through layers)
- 💰 Cost optimization (run expensive LLM operations once)
- ⚡ Fast retrieval (pre-calculated metrics)

## 🚀 Getting Started

### 1. Apply Database Migration

**Option 1: Supabase Dashboard (Recommended)**

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Click "New Query"
3. Copy contents of `supabase/migrations/20251124_level10_analytics_foundation.sql`
4. Paste and click "Run"

**Option 2: Supabase CLI (if Docker running)**

```bash
npx supabase db reset
```

### 2. Test the System

```bash
# Test with your email
npx tsx scripts/test-orchestrator.ts your-email@example.com

# Force full rebuild
npx tsx scripts/test-orchestrator.ts your-email@example.com --force

# Incremental processing
npx tsx scripts/test-orchestrator.ts your-email@example.com --incremental
```

### 3. Verify Results

Check the database tables:

```sql
-- Check threads
SELECT COUNT(*) FROM email_threads;

-- Check contacts
SELECT COUNT(*) FROM participants;

-- Check timeline
SELECT COUNT(*) FROM events_timeline;

-- Check metrics
SELECT * FROM daily_metrics ORDER BY metric_date DESC LIMIT 1;
```

## 📁 Project Structure

```
src/services/analytics/
├── orchestrator.ts              # Main coordinator
├── threadReconstruction.ts      # Email threading logic
├── contactNormalization.ts      # Contact unification
├── timelineBuilder.ts           # Event stream builder
├── processor.ts                 # (existing) Analytics computation
├── messageCacheService.ts       # (existing) Message fetching
└── ... (other services)

supabase/migrations/
└── 20251124_level10_analytics_foundation.sql

scripts/
├── test-orchestrator.ts         # Test the pipeline
└── apply-level10-migration.ts   # Migration helper

docs/
├── LEVEL10_ANALYTICS_PROGRESS.md   # Detailed progress report
├── MIGRATION_SUMMARY.md            # Migration instructions
└── claude_analytics_strat.md       # Original strategy document
```

## 🧪 Core Services

### ThreadReconstructionService

Reconstructs email threads using:

- Message-ID and In-Reply-To headers (primary)
- References header (fallback)
- Subject-based fuzzy matching (last resort)

**Key Features:**

- Handles Gmail threading behavior
- Filters automated responses (<1 min)
- Detects abandoned threads (>7 days)
- Calculates response times (median, not mean)
- Working hours calculation (M-F, 9-5)

### ContactNormalizationService

Unifies email addresses to single identities:

- `john.doe@company.com` = `john@company.com` = `jdoe@company.com`

**Key Features:**

- Smart email matching
- Initials detection
- Domain-based grouping
- Relationship type tracking
- Importance weighting

### TimelineBuilderService

Creates unified event stream:

**Key Features:**

- Merges emails + meetings + (future: Slack)
- Context classification (keyword-based)
- Context switch counting
- Cognitive load calculation
- Hourly breakdowns

**Cognitive Load Formula:**

```
score = (meetings × 3.0) +
        (emails × 0.5) +
        (switches × 2.0) +
        (meeting_minutes × 0.1)
```

### AnalyticsOrchestrator

Coordinates the entire pipeline:

**Process Flow:**

1. Fetch messages from cache
2. Reconstruct threads
3. Normalize contacts
4. Build timeline
5. Calculate metrics
6. Save to database

**Modes:**

- Full rebuild (reprocess everything)
- Incremental (only new data)

## 🎯 Implementation Status

### ✅ Phase 1: Foundation (COMPLETE)

- [x] Database schema (13 tables)
- [x] Thread reconstruction service
- [x] Contact normalization service
- [x] Timeline builder service
- [x] Orchestrator service
- [x] Test scripts
- [x] Documentation

### 🔄 Phase 2: Simple Metrics (NEXT)

- [ ] Response Time Reciprocity
- [ ] Thread Decay Rate
- [ ] Weekend/Evening Creep
- [ ] Reactive vs Proactive Ratio

### 📋 Phase 3: Advanced Metrics

- [ ] Context Switch Tax (foundation ready)
- [ ] Meeting ROI Score
- [ ] Communication Equity Index
- [ ] Collaboration Temperature Map

### 🎨 Phase 4: LLM-Enhanced Metrics

- [ ] Delegation vs Execution Ratio
- [ ] Strategic Focus Alignment
- [ ] Energy Signature Pattern
- [ ] (+ 3 more)

**Progress:** Phase 1 Complete (Foundation) ✅

## 💡 Key Design Decisions

### Why Median Instead of Mean?

Response times have outliers (vacation = 7 days).

Example:

- Times: `[1h, 2h, 3h, 168h]`
- Mean: `43.5h` ❌ (misleading!)
- Median: `2.5h` ✅ (accurate)

### Why Tiered LLM Strategy?

**Tier 1:** Keyword matching (free, instant)
**Tier 2:** Simple regex/NLP (cheap, fast)
**Tier 3:** GPT-4 (expensive, accurate)

**Cost Savings:** 70-90% reduction in API costs

### Why 4 Layers?

- **Raw** - Immutable source of truth
- **Processed** - Normalized, ready for analysis
- **Enriched** - LLM-enhanced insights
- **Metrics** - Pre-calculated for speed

## 🔧 Development

### Run Tests (Future)

```bash
npm run test:analytics
```

### Rebuild Analytics

```bash
npx tsx scripts/rebuild-analytics.ts  # (to be created)
```

### Background Job Integration

The orchestrator can be triggered by:

- Background job (pg-boss)
- API endpoint
- Manual script

## 📚 Documentation

- **[LEVEL10_ANALYTICS_PROGRESS.md](./LEVEL10_ANALYTICS_PROGRESS.md)** - Detailed progress report
- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Migration instructions
- **[claude_analytics_strat.md](./claude_analytics_strat.md)** - Original strategy
- **[.agent/workflows/analytics-implementation.md](./.agent/workflows/analytics-implementation.md)** - Implementation plan

## 🎨 Future: Visualizations

- **Command Center View** - Hero metric + risks/opportunities
- **Time Travel Comparison** - This week vs last month vs last quarter
- **Relationship Portfolio** - Grid of contacts with health scores
- **Heatmaps** - Cognitive load by hour/day
- **Scatter Plots** - Response time reciprocity quadrants
- **Sankey Diagrams** - Time allocation vs priorities

## 🤝 Contributing

Follow TDD principles:

1. Write failing test (Red)
2. Write minimal code to pass (Green)
3. Refactor and clean (Refactor)
4. Repeat

**Quality Gates:**

- 80%+ test coverage
- All tests pass
- No lint errors
- Peer review

## 📝 Notes

- Following user rules (bulk operations, progress tracking)
- Incremental development (smallest verifiable units)
- Cost optimization (tiered LLM approach)
- Performance first (pre-calculated metrics)

---

**Last Updated:** 2025-11-24
**Status:** Phase 1 Complete ✅
**Next:** Apply migration + implement Phase 2 metrics
