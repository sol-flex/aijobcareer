/**
 * Test Daily Sync Script - GLEAN ONLY
 *
 * Tests the daily sync flow with just Glean to verify:
 * - New jobs get added
 * - Existing jobs get skipped
 * - Removed jobs get deprecated
 *
 * Usage: node testDailySyncGlean.js
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
 * Parse job using OpenAI
 */
async function parseJobWithOpenAI(apiJobData, companyName, category) {
    try {
        const apiDataString = JSON.stringify(apiJobData, null, 2);

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
        - Extract location from the "location" field in the JSON
        - Extract title from the "title" field in the JSON
        - Extract description from the "content" field (convert HTML to markdown)

        FULL API JSON DATA:
        ${apiDataString}

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

        // Add metadata
        jobData.applicationUrl = apiJobData.absolute_url;
        jobData.primaryRole = category || jobData.primaryRole;
        jobData.publishedAt = new Date(apiJobData.first_published || Date.now());
        jobData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        jobData.paymentStatus = 'paid';
        jobData.published = true;
        jobData.platform = 'greenhouse';

        return jobData;

    } catch (error) {
        console.error(`      ✗ OpenAI parsing failed:`, error.message);
        return null;
    }
}

/**
 * Test sync with Glean only (limit to 3 new jobs max)
 */
async function testDailySyncGlean() {
    const MAX_NEW_JOBS = 3; // Limit for testing

    try {
        console.log('='.repeat(70));
        console.log('TEST: Daily Sync with Glean');
        console.log('='.repeat(70));
        console.log(`Started at: ${new Date().toLocaleString()}\n`);

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get Glean company
        const company = await Company.findOne({ name: 'Glean' });
        if (!company) {
            console.log('✗ Glean not found in database');
            return;
        }

        console.log(`Processing: ${company.name}`);
        console.log(`Job Website: ${company.jobWebsite}\n`);

        // Step 1: Fetch current jobs from API
        console.log('[1] Fetching current jobs from Greenhouse API...');
        const response = await axios.get('https://boards-api.greenhouse.io/v1/boards/gleanwork/jobs');
        const apiJobs = response.data.jobs.map(job => ({
            id: job.id,
            url: job.absolute_url,
            title: job.title,
            location: job.location?.name
        }));
        console.log(`✓ Found ${apiJobs.length} jobs on Greenhouse\n`);

        // Step 2: Get existing jobs from database
        console.log('[2] Fetching existing jobs from database...');
        const existingJobs = await Job.find({
            company: company.name,
            deprecated: false
        });
        console.log(`✓ Found ${existingJobs.length} active jobs in database\n`);

        // Step 3: Compare URLs
        const apiUrls = new Set(apiJobs.map(job => job.url));
        const dbUrls = new Map(existingJobs.map(job => [job.applicationUrl, job]));

        let stats = {
            new: 0,
            existing: 0,
            deprecated: 0,
            errors: 0
        };

        // Find jobs to deprecate
        console.log('[3] Checking for removed jobs (in DB but not in API)...');
        for (const [url, job] of dbUrls) {
            if (!apiUrls.has(url)) {
                console.log(`  ⊗ Deprecating: ${job.title}`);
                console.log(`    URL: ${url}`);
                console.log(`    Created: ${job.createdAt.toLocaleDateString()}`);
                job.deprecated = true;
                job.deprecatedAt = new Date();
                await job.save();
                stats.deprecated++;
            }
        }
        if (stats.deprecated === 0) {
            console.log(`  ✓ No jobs need deprecating`);
        }
        console.log('');

        // Find new jobs to add
        console.log('[4] Checking for new jobs (in API but not in DB)...');
        console.log(`    (Limited to ${MAX_NEW_JOBS} for testing)\n`);

        for (const apiJob of apiJobs) {
            if (dbUrls.has(apiJob.url)) {
                // Job already exists
                stats.existing++;
            } else {
                // New job
                if (stats.new >= MAX_NEW_JOBS) {
                    console.log(`  → Skipping remaining new jobs (reached limit of ${MAX_NEW_JOBS})`);
                    break;
                }

                console.log(`  + New: ${apiJob.title}`);
                console.log(`    Location: ${apiJob.location}`);
                console.log(`    URL: ${apiJob.url}`);

                try {
                    // Fetch full details
                    console.log(`    → Fetching full details...`);
                    const detailsResponse = await axios.get(
                        `https://boards-api.greenhouse.io/v1/boards/gleanwork/jobs/${apiJob.id}`
                    );
                    const fullJobData = detailsResponse.data;

                    // Parse with OpenAI
                    console.log(`    → Parsing with OpenAI...`);
                    const category = fullJobData.departments?.[0]?.name || 'General';
                    const parsedJob = await parseJobWithOpenAI(fullJobData, company.name, category);

                    if (!parsedJob) {
                        console.log(`    ✗ Failed to parse job`);
                        stats.errors++;
                        continue;
                    }

                    // Add company logo
                    if (company.logo) {
                        parsedJob.companyLogo = company.logo;
                    }

                    // Save to database
                    console.log(`    → Saving to database...`);
                    const job = new Job(parsedJob);
                    await job.save();

                    console.log(`    ✓ SUCCESS! Saved to database`);
                    console.log(`    MongoDB ID: ${job._id}\n`);
                    stats.new++;

                    // Small delay
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error(`    ✗ Error: ${error.message}\n`);
                    stats.errors++;
                }
            }
        }

        // Summary
        console.log('='.repeat(70));
        console.log('SYNC SUMMARY');
        console.log('='.repeat(70));
        console.log(`Company: ${company.name}`);
        console.log(`\nResults:`);
        console.log(`  New jobs added: ${stats.new}`);
        console.log(`  Existing jobs (skipped): ${stats.existing}`);
        console.log(`  Jobs deprecated: ${stats.deprecated}`);
        if (stats.errors > 0) {
            console.log(`  Errors: ${stats.errors}`);
        }

        // Update company metadata
        company.platform = 'greenhouse';
        company.lastSyncedAt = new Date();
        await company.save();
        console.log(`\n✓ Updated company.platform = 'greenhouse'`);
        console.log(`✓ Updated company.lastSyncedAt = ${company.lastSyncedAt.toLocaleString()}`);

        // Final database counts
        const totalGleanJobs = await Job.countDocuments({ company: 'Glean', deprecated: false });
        const deprecatedGleanJobs = await Job.countDocuments({ company: 'Glean', deprecated: true });
        console.log(`\nFinal Database State:`);
        console.log(`  Active Glean jobs: ${totalGleanJobs}`);
        console.log(`  Deprecated Glean jobs: ${deprecatedGleanJobs}`);

    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

// Run the test
testDailySyncGlean();
