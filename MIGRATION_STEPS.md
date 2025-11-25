# Analytics Migration - Quick Reference

## ✅ Step 1: Apply Migration

The migration SQL has been **copied to your clipboard**!

1. Open: https://supabase.com/dashboard/project/cqejejllmbzzsvtbyuke/sql
2. Click "+ New query"
3. Paste (Cmd+V)
4. Click "Run"

## ✅ Step 2: Test Setup

After the migration runs successfully, test it:

```bash
node scripts/test-analytics-setup.js
```

This will:

- ✅ Verify all 3 tables exist
- ✅ Create a test job
- ✅ Update job progress
- ✅ Cache a test message
- ✅ Store analytics cache
- ✅ Clean up test data

## ✅ Step 3: Test API Endpoint

Test job creation via your running dev server:

```bash
# Your dev server is running on localhost:3000
# Create a test job
curl -X POST http://localhost:3000/api/analytics/jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .next/cache/cookies.txt 2>/dev/null || echo '')" \
  -d '{
    "job_type": "fetch_messages",
    "metadata": {
      "days_back": 7,
      "test": true
    }
  }'
```

Expected output:

```json
{
  "success": true,
  "job": {
    "id": "...",
    "status": "pending",
    "job_type": "fetch_messages",
    "progress": 0,
    "total": 0
  }
}
```

## 📊 What Was Created

### Database Tables

- `analytics_jobs` - Background job tracking
- `message_cache` - Gmail message cache
- `analytics_cache` - Computed analytics cache

### Services

- `JobService` - Job management
- `MessageCacheService` - Message caching

### API Routes

- `POST /api/analytics/jobs` - Create job
- `GET /api/analytics/jobs` - List jobs
- `GET /api/analytics/jobs/:id` - Job status

## 🎯 Next Steps

After verification:

1. Implement background worker
2. Add ProgressTracker UI component
3. Update analytics route to use jobs

See `IMPLEMENTATION_SUMMARY.md` for full details!
