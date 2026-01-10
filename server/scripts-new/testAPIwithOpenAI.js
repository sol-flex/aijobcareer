/**
 * Test: API (fast) + OpenAI parsing (proven)
 * Get jobs via Greenhouse API, parse with OpenAI, save to DB
 */

const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const { OpenAI } = require('openai');
const { z } = require('zod');
const { zodResponseFormat } = require('openai/helpers/zod');
const cheerio = require('cheerio');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Job = require('../models/Job');
const Company = require('../models/Company');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Same Zod schema from your jobScraper.js
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
 * Parse job using OpenAI (same as your old jobScraper.js)
 * But instead of Puppeteer, we pass API data
 */
async function parseJobWithOpenAI(apiJobData, companyName, category) {
    try {
        console.log(`\n  → Parsing with OpenAI...`);

        // Pass the entire API response JSON to OpenAI
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

        // Calculate cost
        const inputTokens = completion.usage?.prompt_tokens || 0;
        const outputTokens = completion.usage?.completion_tokens || 0;
        const cost = (inputTokens * 0.150 / 1000000) + (outputTokens * 0.600 / 1000000);
        console.log(`  💰 OpenAI: ${inputTokens} in + ${outputTokens} out = $${cost.toFixed(4)}`);

        let jobData = JSON.parse(completion.choices[0].message.content);

        // Add metadata
        jobData.applicationUrl = apiJobData.absolute_url;
        jobData.primaryRole = category || jobData.primaryRole;
        jobData.publishedAt = new Date(apiJobData.first_published);
        jobData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        jobData.paymentStatus = 'paid';
        jobData.published = true;

        return jobData;

    } catch (error) {
        console.error(`  ✗ OpenAI parsing failed:`, error.message);
        return null;
    }
}

/**
 * Main test function
 */
async function testAPIWithOpenAI() {
    let jobsAdded = 0;
    const TARGET_JOBS = 2;

    try {
        console.log('='.repeat(70));
        console.log('TEST: API + OpenAI Approach');
        console.log('='.repeat(70));

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get Glean company from database
        const company = await Company.findOne({ name: 'Glean' });
        if (!company) {
            console.log('⚠️  Glean not found in Company database');
            console.log('Creating Glean company entry...');
            // Could create it here, but let's assume it exists
        }

        // Step 1: Fetch all jobs from Greenhouse API (FAST!)
        console.log('[1] Fetching Glean jobs from Greenhouse API...');
        const listResponse = await axios.get('https://boards-api.greenhouse.io/v1/boards/gleanwork/jobs');
        const allJobs = listResponse.data.jobs;
        console.log(`✓ Found ${allJobs.length} jobs on Greenhouse\n`);

        // Step 2: Loop through jobs
        console.log(`[2] Processing jobs (stopping after ${TARGET_JOBS} new jobs added)...`);
        console.log('-'.repeat(70));

        for (const jobSummary of allJobs) {
            if (jobsAdded >= TARGET_JOBS) {
                console.log(`\n✓ Target reached: ${TARGET_JOBS} new jobs added`);
                break;
            }

            console.log(`\n${jobsAdded + 1}. ${jobSummary.title}`);
            console.log(`   Location: ${jobSummary.location?.name}`);
            console.log(`   URL: ${jobSummary.absolute_url}`);

            // Step 3: Check if already exists in database
            const existingJob = await Job.findOne({
                applicationUrl: jobSummary.absolute_url
            });

            if (existingJob) {
                console.log(`   ⊘ Already exists in database (created ${existingJob.createdAt.toLocaleDateString()})`);
                continue;
            }

            console.log(`   ✓ New job! Fetching full details...`);

            // Step 4: Get full job details from API
            const detailsResponse = await axios.get(
                `https://boards-api.greenhouse.io/v1/boards/gleanwork/jobs/${jobSummary.id}`
            );
            const fullJobData = detailsResponse.data;

            // Step 5: Parse with OpenAI (same as your old jobScraper.js)
            const category = fullJobData.departments?.[0]?.name || 'General';
            const parsedJob = await parseJobWithOpenAI(fullJobData, 'Glean', category);

            if (!parsedJob) {
                console.log(`   ✗ Failed to parse job`);
                continue;
            }

            // Add company logo if available
            if (company?.logo) {
                parsedJob.companyLogo = company.logo;
            }

            // Step 6: Save to database
            console.log(`   → Saving to database...`);
            const job = new Job(parsedJob);
            await job.save();

            console.log(`   ✓ SUCCESS! Saved to database`);
            console.log(`   MongoDB ID: ${job._id}`);
            jobsAdded++;

            // Small delay to be nice to APIs
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n' + '='.repeat(70));
        console.log('TEST COMPLETE');
        console.log('='.repeat(70));
        console.log(`Jobs added: ${jobsAdded}`);
        console.log(`Total Glean jobs in database: ${await Job.countDocuments({ company: 'Glean' })}`);

    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

// Run the test
testAPIWithOpenAI();
