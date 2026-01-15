/**
 * Crypto Job Sync Script
 *
 * Loops through all CRYPTO companies in database and:
 * 1. Detects their ATS platform (greenhouse/lever/ashby)
 * 2. Fetches current jobs from their API
 * 3. Compares with database:
 *    - Adds new jobs (in API, not in DB)
 *    - Skips existing jobs (in both)
 *    - Deletes removed jobs (in DB, not in API)
 * 4. Updates company.lastSyncedAt
 *
 * Usage: node cryptoSyncJobs.js
 */

const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const { OpenAI } = require('openai');
const { z } = require('zod');
const { zodResponseFormat } = require('openai/helpers/zod');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Job = require('../models/Job');
const Company = require('../models/Company');

// Import platform adapters
const { extractLeverIdentifier, fetchLeverJobs, fetchLeverJobDetails } = require('./adapters/leverAdapter');
const { extractAshbyIdentifier, fetchAshbyJobs, fetchAshbyJobDetails } = require('./adapters/ashbyAdapter');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Zod schema for OpenAI parsing
const JobPosting = z.object({
    company: z.string(),
    companyLogo: z.string().optional(),
    title: z.string(),
    primaryRole: z.string(),
    positionType: z.enum(["Full-Time", "Part-Time", "Contract"]),
    locationType: z.enum(["Remote", "On Site", "Hybrid"]),
    country: z.string(),
    locations: z.string(),
    description: z.string(),
    keywords: z.string().optional(),
    currency: z.string(),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    equityMin: z.number().optional(),
    equityMax: z.number().optional(),
    cryptoPayment: z.boolean(),
    applicationMethod: z.enum(["Apply by website", "Apply by email"]),
    applicationUrl: z.string()
});

/**
 * Detect ATS platform from URL
 */
function detectPlatform(url) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('greenhouse.io')) return 'greenhouse';
    if (urlLower.includes('lever.co')) return 'lever';
    if (urlLower.includes('ashbyhq.com')) return 'ashby';
    return null;
}

/**
 * Extract company identifier from job website URL
 * Examples:
 * - https://boards.greenhouse.io/gleanwork → gleanwork
 * - https://job-boards.greenhouse.io/anthropic → anthropic
 */
function extractGreenhouseIdentifier(url) {
    const match = url.match(/greenhouse\.io\/([^\/\?]+)/);
    return match ? match[1] : null;
}

/**
 * Parse job using OpenAI (same approach as testAPIWithOpenAI.js)
 */
async function parseJobWithOpenAI(apiJobData, companyName, category, platform) {
    try {
        // For Lever jobs, use the pre-combined content for reliable parsing
        let contentToAnalyze;
        if (platform === 'lever' && apiJobData.combinedContent) {
            contentToAnalyze = `
JOB CONTENT (all sections combined):
${apiJobData.combinedContent}

METADATA:
- Title: ${apiJobData.text}
- Location: ${apiJobData.categories?.location || apiJobData.workplaceType || 'Not specified'}
- URL: ${apiJobData.hostedUrl}
`;
        } else {
            contentToAnalyze = JSON.stringify(apiJobData, null, 2);
        }

        const prompt = `
        Please analyze this job posting content and extract information to fill a job schema.
        Return ONLY a JSON object with these fields from our mongoose Job model:

        {
            "company": "Company name",
            "companyLogo": "Logo URL (if able to identify)",
            "title": "Job title",
            "primaryRole": "Main role category",
            "positionType": "Full-Time/Part-Time/Contract",
            "locationType": "Remote/On Site/Hybrid",
            "country": "Country of job",
            "locations": "City/Cities",
            "description": "Full job description",
            "keywords": "Relevant skills and technologies, comma separated",
            "currency": "Salary currency (default USD)",
            "salaryMin": "Minimum salary if listed (numeric only)",
            "salaryMax": "Maximum salary if listed (numeric only)",
            "equityMin": "Minimum equity if listed (numeric only)",
            "equityMax": "Maximum equity if listed (numeric only)",
            "cryptoPayment": false,
            "applicationMethod": "Apply by website",
            "applicationUrl": "Application URL"
        }

        IMPORTANT:
        - Use the EXACT original job description text for the description field
        - Add appropriate markdown formatting for the description
          * Use ## for main section headers (e.g., "## About Us", "## Responsibilities", "## Requirements")
          * Use bullet points (- or *) for lists
          * Use **bold** for emphasis on important terms
          * Add line breaks between sections for readability
          * Preserve any existing lists or formatting structure
          * Do not summarize or remove any content

        - Do not summarize or modify the description
        - If currency is not specified, use "USD"
        - If cryptoPayment is not specified, use false
        - If applicationMethod is not clear, use "Apply by website"
        - For locations field: if Remote, use "Remote" or "Remote - [Country]"
        - Extract location from the "location" field in the data
        - Extract title from the "title" or "text" field in the data

        FULL JOB DATA:
        ${contentToAnalyze}

        Company name: ${companyName}
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a job posting analyzer. Extract job details and return only valid JSON matching the specified schema. Make educated guesses for missing fields based on context. Ensure all required fields have values."
                },
                { role: "user", content: prompt }
            ],
            response_format: zodResponseFormat(JobPosting, "job_response"),
            temperature: 0.7,
        });

        const inputTokens = completion.usage?.prompt_tokens || 0;
        const outputTokens = completion.usage?.completion_tokens || 0;
        const cost = (inputTokens * 0.150 / 1000000) + (outputTokens * 0.600 / 1000000);
        console.log(`      💰 OpenAI: ${inputTokens} in + ${outputTokens} out = $${cost.toFixed(4)}`);

        let jobData = JSON.parse(completion.choices[0].message.content);

        // Add platform-specific metadata
        if (platform === 'greenhouse') {
            jobData.applicationUrl = apiJobData.absolute_url;
            jobData.publishedAt = new Date(apiJobData.first_published || Date.now());
        } else if (platform === 'lever') {
            jobData.applicationUrl = apiJobData.hostedUrl;
            jobData.publishedAt = new Date(apiJobData.createdAt || Date.now());
        } else if (platform === 'ashby') {
            jobData.applicationUrl = apiJobData.externalLink || `https://jobs.ashbyhq.com/${companyName}/${apiJobData.id}`;
            jobData.publishedAt = new Date(apiJobData.publishedDate || Date.now());
        }

        // Force exact company name from database (override OpenAI's parsing)
        jobData.company = companyName;
        jobData.primaryRole = category || jobData.primaryRole;
        jobData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        jobData.paymentStatus = 'paid';
        jobData.published = true;
        jobData.platform = platform;

        return jobData;

    } catch (error) {
        console.error(`      ✗ OpenAI parsing failed:`, error.message);
        return null;
    }
}

/**
 * Fetch jobs from Greenhouse API
 */
async function fetchGreenhouseJobs(identifier) {
    try {
        const response = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${identifier}/jobs`);
        return response.data.jobs.map(job => ({
            id: job.id,
            url: job.absolute_url,
            title: job.title,
            location: job.location?.name
        }));
    } catch (error) {
        console.error(`    ✗ Failed to fetch Greenhouse jobs: ${error.message}`);
        return null;
    }
}

/**
 * Sync jobs for a single company
 */
async function syncCompanyJobs(company) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Syncing: ${company.name}`);
    console.log(`${'='.repeat(70)}`);

    // Step 1: Detect platform
    const platform = detectPlatform(company.jobWebsite);

    if (!platform) {
        console.log(`  ⊘ No supported ATS platform detected (${company.jobWebsite})`);
        console.log(`  → Skipping this company`);
        return { skipped: true, reason: 'no_platform' };
    }

    console.log(`  ✓ Platform detected: ${platform}`);

    // Step 2: Fetch current jobs from API
    let apiJobs;
    let identifier;

    if (platform === 'greenhouse') {
        identifier = extractGreenhouseIdentifier(company.jobWebsite);
        if (!identifier) {
            console.log(`  ✗ Could not extract Greenhouse identifier from ${company.jobWebsite}`);
            return { skipped: true, reason: 'invalid_url' };
        }
        console.log(`  → Fetching jobs from Greenhouse (${identifier})...`);
        apiJobs = await fetchGreenhouseJobs(identifier);
    } else if (platform === 'lever') {
        identifier = extractLeverIdentifier(company.jobWebsite);
        if (!identifier) {
            console.log(`  ✗ Could not extract Lever identifier from ${company.jobWebsite}`);
            return { skipped: true, reason: 'invalid_url' };
        }
        console.log(`  → Fetching jobs from Lever (${identifier})...`);
        apiJobs = await fetchLeverJobs(identifier);
    } else if (platform === 'ashby') {
        identifier = extractAshbyIdentifier(company.jobWebsite);
        if (!identifier) {
            console.log(`  ✗ Could not extract Ashby identifier from ${company.jobWebsite}`);
            return { skipped: true, reason: 'invalid_url' };
        }
        console.log(`  → Fetching jobs from Ashby (${identifier})...`);
        apiJobs = await fetchAshbyJobs(identifier);
    }

    if (!apiJobs) {
        console.log(`  ✗ Failed to fetch jobs from API`);
        return { skipped: true, reason: 'api_error' };
    }

    console.log(`  ✓ Found ${apiJobs.length} jobs on ${platform}`);

    // Step 3: Get existing non-deprecated jobs from database
    // Use case-insensitive search to handle historical naming inconsistencies
    const companyNameEscaped = company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingJobs = await Job.find({
        company: { $regex: new RegExp('^' + companyNameEscaped + '$', 'i') },
        deprecated: false
    });

    console.log(`  ✓ Found ${existingJobs.length} active jobs in database`);

    // Step 4: Compare and sync
    const apiUrls = new Set(apiJobs.map(job => job.url));
    const dbUrls = new Map(existingJobs.map(job => [job.applicationUrl, job]));

    let stats = {
        new: 0,
        existing: 0,
        deleted: 0,
        errors: 0
    };

    // Find jobs to delete (in DB but not in API)
    console.log(`\n  [Checking for removed jobs...]`);
    for (const [url, job] of dbUrls) {
        if (!apiUrls.has(url)) {
            console.log(`    🗑️  DELETING: ${job.title}`);
            console.log(`      DB URL:  ${url}`);
            console.log(`      Job ID:  ${job._id}`);
            console.log(`      Created: ${job.createdAt.toLocaleDateString()}`);
            await Job.deleteOne({ _id: job._id });
            stats.deleted++;
        }
    }

    if (stats.deleted === 0) {
        console.log(`    ✓ No jobs need deleting (all jobs still active)`);
    }

    // Find new jobs to add (in API but not in DB)
    console.log(`\n  [Checking for new jobs...]`);
    const MAX_NEW_JOBS_PER_COMPANY = process.env.MAX_NEW_JOBS || 4; // Default limit for safety
    for (const apiJob of apiJobs) {
        if (dbUrls.has(apiJob.url)) {
            // Job already exists
            stats.existing++;
        } else {
            // Check if we've hit the limit
            if (stats.new >= MAX_NEW_JOBS_PER_COMPANY) {
                console.log(`\n    → Reached limit of ${MAX_NEW_JOBS_PER_COMPANY} new jobs per company`);
                break;
            }
            // New job - need to fetch details and parse
            console.log(`    + New: ${apiJob.title}`);
            console.log(`      Location: ${apiJob.location}`);
            console.log(`      URL: ${apiJob.url}`);

            try {
                // Fetch full job details based on platform
                console.log(`      → Fetching full details...`);
                let fullJobData;
                let category;

                if (platform === 'greenhouse') {
                    const detailsResponse = await axios.get(
                        `https://boards-api.greenhouse.io/v1/boards/${identifier}/jobs/${apiJob.id}`
                    );
                    fullJobData = detailsResponse.data;
                    category = fullJobData.departments?.[0]?.name || 'General';
                } else if (platform === 'lever') {
                    fullJobData = await fetchLeverJobDetails(identifier, apiJob.id);
                    category = fullJobData.categories?.team || fullJobData.categories?.department || 'General';
                } else if (platform === 'ashby') {
                    fullJobData = await fetchAshbyJobDetails(identifier, apiJob.id);
                    category = fullJobData.departmentName || 'General';
                }

                if (!fullJobData) {
                    console.log(`      ✗ Failed to fetch job details`);
                    stats.errors++;
                    continue;
                }

                // Parse with OpenAI
                console.log(`      → Parsing with OpenAI...`);
                const parsedJob = await parseJobWithOpenAI(fullJobData, company.name, category, platform);

                if (!parsedJob) {
                    console.log(`      ✗ Failed to parse job`);
                    stats.errors++;
                    continue;
                }

                // Add company logo
                if (company.logo) {
                    parsedJob.companyLogo = company.logo;
                }

                // Save to database
                console.log(`      → Saving to database...`);
                const job = new Job(parsedJob);
                await job.save();

                console.log(`      ✓ SUCCESS! Saved to database`);
                stats.new++;

                // Small delay to be nice to APIs
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`      ✗ Error processing job: ${error.message}`);
                stats.errors++;
            }
        }
    }

    console.log(`\n  Summary:`);
    console.log(`    New jobs added: ${stats.new}`);
    console.log(`    Existing jobs (skipped): ${stats.existing}`);
    console.log(`    Jobs deleted: ${stats.deleted}`);
    if (stats.errors > 0) {
        console.log(`    Errors: ${stats.errors}`);
    }

    // Step 5: Update company metadata
    company.platform = platform;
    company.lastSyncedAt = new Date();
    await company.save();

    return stats;
}

/**
 * Main sync function
 */
async function dailySyncJobs() {
    let totalStats = {
        companies: 0,
        skipped: 0,
        new: 0,
        existing: 0,
        deleted: 0,
        errors: 0
    };

    try {
        console.log('='.repeat(70));
        console.log('CRYPTO JOB SYNC');
        console.log('='.repeat(70));
        console.log(`Started at: ${new Date().toLocaleString()}\n`);

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get CRYPTO companies only - filter to only those with supported platforms
        const companyFilter = process.argv[2]; // e.g. node cryptoSyncJobs.js "Coinbase"
        const query = companyFilter
            ? { name: companyFilter, categories: 'Crypto' }
            : {
                platform: { $in: ['greenhouse', 'lever', 'ashby'] },
                categories: 'Crypto'
              };
        const companies = await Company.find(query);

        if (companyFilter) {
            console.log(`Filtering to crypto company: ${companyFilter}`);
        } else {
            console.log(`Filtering to CRYPTO companies with Greenhouse, Lever, or Ashby platforms`);
        }
        console.log(`Found ${companies.length} crypto companies to sync\n`);

        // Sync each company
        for (const company of companies) {
            totalStats.companies++;

            const result = await syncCompanyJobs(company);

            if (result.skipped) {
                totalStats.skipped++;
            } else {
                totalStats.new += result.new || 0;
                totalStats.existing += result.existing || 0;
                totalStats.deleted += result.deleted || 0;
                totalStats.errors += result.errors || 0;
            }

            // Small delay between companies
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Final summary
        console.log('\n' + '='.repeat(70));
        console.log('SYNC COMPLETE');
        console.log('='.repeat(70));
        console.log(`Completed at: ${new Date().toLocaleString()}`);
        console.log(`\n📊 Overall Statistics:`);
        console.log(`  Companies processed: ${totalStats.companies}`);
        console.log(`  Companies skipped: ${totalStats.skipped}`);
        console.log(`  ➕ New jobs added: ${totalStats.new}`);
        console.log(`  ✓ Existing jobs (unchanged): ${totalStats.existing}`);
        console.log(`  🗑️  Jobs deleted: ${totalStats.deleted}`);
        if (totalStats.errors > 0) {
            console.log(`  ❌ Errors: ${totalStats.errors}`);
        }

    } catch (error) {
        console.error('\n✗ Fatal Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

// Run the sync
dailySyncJobs();
