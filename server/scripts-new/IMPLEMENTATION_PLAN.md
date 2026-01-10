# Implementation Plan: API + LLM Approach

## Goal
Replace expensive Puppeteer + OpenAI scraping with cheap API + LLM formatting.

## Architecture Comparison

### OLD Daily Process (scripts/getJobLinks.js):
```
Company DB → For each company:
  1. Puppeteer load page (2-5 sec)
  2. Send entire HTML to OpenAI
     - Extract: title, location, salary, description, everything
     - Cost: ~$0.05-0.20 per company
  3. Save to MongoDB
```

### NEW Daily Process (scripts-new/getJobLinksNew.js):
```
Company DB → For each company:
  1. Detect ATS (instant)
  2. API call for metadata (0.5 sec, FREE)
     - Get: title, location, salary, role, etc.
  3. LLM for description only
     - Input: HTML description
     - Output: Clean markdown
     - Cost: ~$0.0015 per job
  4. Save to MongoDB
```

## Files That Need Changes

### ✅ Already Created:
- `scripts-new/getJobLinksNew.js` - Main orchestrator (DONE)
- `scripts-new/atsDetector.js` - Platform detection (DONE)
- `scripts-new/adapters/greenhouseAdapter.js` - Greenhouse API (DONE)
- `scripts-new/adapters/leverAdapter.js` - Lever API (DONE)
- `scripts-new/adapters/ashbyAdapter.js` - Ashby (needs fixing)

### 🔧 Needs Updates:
1. **Add LLM formatter** to each adapter
   - greenhouseAdapter.js
   - leverAdapter.js
   - ashbyAdapter.js

2. **Update adapters** to use LLM for description
   - Currently: description = rawHTML (has vendor styles)
   - New: description = await llmFormat(rawHTML) (clean markdown)

### ⚙️ Daily Cron Job:
```bash
# OLD (stop running this):
node server/scripts/getJobLinks.js

# NEW (run this instead):
node server/scripts-new/getJobLinksNew.js
```

## Implementation Steps

### Step 1: Add LLM Formatter
Create `adapters/llmFormatter.js` with function:
```javascript
async function htmlToMarkdownWithLLM(html) {
  // Send to OpenAI GPT-4o-mini
  // Cost: ~$0.0015 per job
  // Returns: Clean markdown
}
```

### Step 2: Update Greenhouse Adapter
```javascript
// OLD (line 85-91):
const description = (job.content || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

// NEW:
const { htmlToMarkdownWithLLM } = require('./llmFormatter');
const description = await htmlToMarkdownWithLLM(job.content);
```

### Step 3: Update Lever Adapter
Same change - use LLM formatter instead of keeping HTML.

### Step 4: Update Ashby Adapter
Same change - use LLM formatter instead of manual HTML conversion.

### Step 5: Test
```bash
cd server/scripts-new
node testSaveToDb.js  # Test saving 2 jobs
# Check if descriptions are clean markdown
```

### Step 6: Deploy
```bash
# Update your cron job to use new script
crontab -e
# Change: 0 2 * * * node /path/to/scripts/getJobLinks.js
# To:     0 2 * * * node /path/to/scripts-new/getJobLinksNew.js
```

## Cost Comparison

### Scenario: 100 companies, 3,000 total jobs

**OLD Approach:**
- 100 companies × $0.10 = $10 per run
- Daily = ~$300/month

**NEW Approach:**
- 100 API calls = $0
- 3,000 jobs × $0.0015 = $4.50 per run
- Daily = ~$135/month

**Savings: 55% reduction** 🎉

Plus:
- 10x faster
- More reliable (APIs don't break)
- Better data quality

## Frontend Changes

### Required:
**None!** Your frontend already uses ReactMarkdown, so markdown descriptions work out of the box.

### Optional:
Add fallback to handle both HTML (old jobs) and Markdown (new jobs):
```jsx
{job.description.includes('<div') ? (
  <div dangerouslySetInnerHTML={{ __html: job.description }} />
) : (
  <ReactMarkdown>{job.description}</ReactMarkdown>
)}
```

## Rollout Strategy

### Week 1: Test
- Run new script manually
- Verify jobs look good
- Check costs

### Week 2: Parallel
- Run both scripts
- Compare results
- Monitor for issues

### Week 3: Cutover
- Switch cron to new script
- Deprecate old script
- Celebrate savings! 🎉

## Questions to Answer

1. ✅ Should we use LLM for descriptions? **YES - only $0.0015/job**
2. ✅ Can we handle both HTML and markdown? **YES - simple conditional**
3. ✅ Will jobs look consistent? **YES - LLM makes uniform markdown**
4. ✅ Is this cheaper? **YES - 55% cost reduction**
5. ✅ Is this faster? **YES - 10x faster than Puppeteer**

## Next Action

**I can implement Steps 1-4 right now if you approve.**

This will:
1. Create the LLM formatter
2. Update all 3 adapters to use it
3. Test with Glean jobs
4. Show you the clean markdown output

Ready to proceed?
