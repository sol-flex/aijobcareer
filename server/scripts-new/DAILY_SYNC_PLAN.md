# Daily Job Sync Implementation Plan

## Goal
Daily cron job that:
1. Loops through companies in database
2. Adds new jobs from APIs
3. Marks removed jobs as deprecated

## Schema Changes Needed

### Job Model - Add Deprecation Fields
```javascript
// server/models/Job.js
{
  deprecated: { type: Boolean, default: false },
  deprecatedAt: { type: Date },
  platform: { type: String, enum: ['greenhouse', 'lever', 'ashby', 'scraped'] }
}
```

### Company Model - Add Platform Field
```javascript
// server/models/Company.js
{
  platform: { type: String, enum: ['greenhouse', 'lever', 'ashby', 'unknown'] },
  lastSyncedAt: { type: Date }
}
```

## Daily Sync Flow

```
FOR EACH company in database:

  1. Detect platform (greenhouse/lever/ashby)

  2. Fetch current jobs from API
     → Get list of all job URLs currently posted

  3. Get existing jobs from database for this company
     → WHERE company = X AND deprecated = false

  4. Compare:

     NEW JOBS (in API, not in DB):
     - Fetch full details
     - Parse with OpenAI
     - Save to database

     EXISTING JOBS (in both API and DB):
     - Skip (already in database)

     REMOVED JOBS (in DB, not in API):
     - Mark as deprecated
     - Set deprecatedAt = now
     - Frontend will hide these

  5. Update company.lastSyncedAt
```

## Example Flow:

### Before Sync:
```
Database has:
- Job A (URL: /jobs/123)
- Job B (URL: /jobs/456)
- Job C (URL: /jobs/789)

API currently has:
- Job A (URL: /jobs/123) ✓ still posted
- Job B (URL: /jobs/456) ✓ still posted
- Job D (URL: /jobs/999) ✓ new job!

Results:
- Job A: No change (exists in both)
- Job B: No change (exists in both)
- Job C: Mark deprecated (no longer on API)
- Job D: Add to database (new)
```

## Frontend Query Changes

### OLD:
```javascript
// Show all published jobs
Job.find({ published: true })
```

### NEW:
```javascript
// Show only active jobs (not deprecated)
Job.find({ published: true, deprecated: false })
```

### Optional - Show Deprecated Jobs:
```javascript
// On job detail page, if deprecated:
if (job.deprecated) {
  return (
    <div className="bg-yellow-100 p-4 rounded">
      ⚠️ This position has been filled or is no longer available.
      It was removed on {job.deprecatedAt.toLocaleDateString()}
    </div>
  )
}
```

## Cron Job Setup

### Entry Point:
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/server/scripts-new && node dailySyncJobs.js
```

### Or with node-cron (in your Express server):
```javascript
const cron = require('node-cron');

// Run every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting daily job sync...');
  await dailySyncJobs();
});
```

## Auto-Cleanup (Optional)

Delete jobs deprecated for >90 days:

```javascript
// Run weekly
async function cleanupOldJobs() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const result = await Job.deleteMany({
    deprecated: true,
    deprecatedAt: { $lt: ninetyDaysAgo }
  });

  console.log(`Cleaned up ${result.deletedCount} old deprecated jobs`);
}
```

## Benefits

### Deprecation Flag Approach:
- ✅ Graceful handling of removed jobs
- ✅ Historical data preserved
- ✅ No broken links
- ✅ Can show "position filled" message
- ✅ Can analyze job posting durations
- ✅ Can auto-clean later

### vs Deletion:
- ❌ Broken user bookmarks
- ❌ Lost analytics data
- ❌ 404 errors
- ❌ Can't track how long jobs stay open

## Cost Estimate

### 100 companies, average 30 jobs each = 3,000 total jobs

**Daily sync:**
- API calls: FREE
- New jobs: ~5 per company × 100 = 500 new jobs/day
- OpenAI: 500 × $0.001 = $0.50/day
- **~$15/month**

**vs OLD approach:**
- Puppeteer + OpenAI for all: 100 × $0.10 = $10/day
- **~$300/month**

**Savings: $285/month (95% reduction)**

## Next Steps

1. Update Job model schema (add deprecated, deprecatedAt, platform)
2. Update Company model schema (add platform, lastSyncedAt)
3. Create dailySyncJobs.js script
4. Update frontend to filter deprecated jobs
5. Set up cron job
6. (Optional) Add cleanup job for old deprecated jobs
