/**
 * Test Daily Sync with Mistral AI (Lever platform)
 * Limits to 2 new jobs for testing
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

const { extractLeverIdentifier, fetchLeverJobs, fetchLeverJobDetails } = require('./adapters/leverAdapter');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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

async function parseJobWithOpenAI(apiJobData, companyName, category, platform) {
    try {
        const apiDataString = JSON.stringify(apiJobData, null, 2);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a job posting analyzer. Extract job details and return only valid JSON matching the specified schema."
                },
                {
                    role: "user",
                    content: `Extract job posting details from this API data:\n\n${apiDataString}\n\nCompany: ${companyName}`
                }
            ],
            response_format: zodResponseFormat(JobPosting, "job_response"),
            temperature: 0.7,
        });

        const inputTokens = completion.usage?.prompt_tokens || 0;
        const outputTokens = completion.usage?.completion_tokens || 0;
        const cost = (inputTokens * 0.150 / 1000000) + (outputTokens * 0.600 / 1000000);
        console.log(`      💰 OpenAI: ${inputTokens} in + ${outputTokens} out = $${cost.toFixed(4)}`);

        let jobData = JSON.parse(completion.choices[0].message.content);

        jobData.applicationUrl = apiJobData.hostedUrl;
        jobData.publishedAt = new Date(apiJobData.createdAt || Date.now());
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

async function testSyncMistral() {
    const MAX_NEW_JOBS = 2;

    try {
        console.log('='.repeat(70));
        console.log('TEST: Daily Sync with Mistral AI (Lever)');
        console.log('='.repeat(70));

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const company = await Company.findOne({ name: 'Mistral AI' });
        if (!company) {
            console.log('✗ Mistral AI not found in database');
            return;
        }

        console.log(`Processing: ${company.name}`);
        console.log(`Platform: lever`);
        console.log(`Job Website: ${company.jobWebsite}\n`);

        const identifier = extractLeverIdentifier(company.jobWebsite);
        console.log(`[1] Fetching jobs from Lever (${identifier})...`);
        const apiJobs = await fetchLeverJobs(identifier);

        if (!apiJobs) {
            console.log('✗ Failed to fetch jobs');
            return;
        }

        console.log(`✓ Found ${apiJobs.length} jobs on Lever\n`);

        console.log('[2] Checking database...');
        const existingJobs = await Job.find({
            company: company.name,
            deprecated: false
        });
        console.log(`✓ Found ${existingJobs.length} active jobs in database\n`);

        const apiUrls = new Set(apiJobs.map(job => job.url));
        const dbUrls = new Map(existingJobs.map(job => [job.applicationUrl, job]));

        let stats = { new: 0, existing: 0, deprecated: 0 };

        console.log('[3] Checking for removed jobs...');
        for (const [url, job] of dbUrls) {
            if (!apiUrls.has(url)) {
                console.log(`  ⊗ Deprecating: ${job.title}`);
                job.deprecated = true;
                job.deprecatedAt = new Date();
                await job.save();
                stats.deprecated++;
            }
        }
        if (stats.deprecated === 0) {
            console.log(`  ✓ No jobs need deprecating\n`);
        }

        console.log(`[4] Checking for new jobs (limit ${MAX_NEW_JOBS})...\n`);
        for (const apiJob of apiJobs) {
            if (dbUrls.has(apiJob.url)) {
                stats.existing++;
            } else {
                if (stats.new >= MAX_NEW_JOBS) break;

                console.log(`  + New: ${apiJob.title}`);
                console.log(`    Location: ${apiJob.location}`);
                console.log(`    URL: ${apiJob.url}`);

                const fullJobData = await fetchLeverJobDetails(identifier, apiJob.id);
                if (!fullJobData) {
                    console.log(`    ✗ Failed to fetch details\n`);
                    continue;
                }

                console.log(`    → Parsing with OpenAI...`);
                const category = fullJobData.categories?.team || 'General';
                const parsedJob = await parseJobWithOpenAI(fullJobData, company.name, category, 'lever');

                if (!parsedJob) {
                    console.log(`    ✗ Failed to parse\n`);
                    continue;
                }

                if (company.logo) {
                    parsedJob.companyLogo = company.logo;
                }

                console.log(`    → Saving to database...`);
                await new Job(parsedJob).save();
                console.log(`    ✓ SUCCESS!\n`);
                stats.new++;

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('='.repeat(70));
        console.log('RESULTS');
        console.log('='.repeat(70));
        console.log(`New jobs: ${stats.new}`);
        console.log(`Existing jobs (skipped): ${stats.existing}`);
        console.log(`Deprecated jobs: ${stats.deprecated}`);

    } catch (error) {
        console.error('\n✗ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

testSyncMistral();
