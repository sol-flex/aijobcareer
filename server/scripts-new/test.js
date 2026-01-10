/**
 * Quick test script to try the new API-based approach
 * Run: node test.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Company = require('../models/Company');
const { detectATSPlatform } = require('./atsDetector');
const greenhouseAdapter = require('./adapters/greenhouseAdapter');
const leverAdapter = require('./adapters/leverAdapter');
const ashbyAdapter = require('./adapters/ashbyAdapter');

/**
 * Test a single company URL
 */
async function testURL(url, companyName) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${companyName || url}`);
    console.log('='.repeat(80));

    try {
        // Detect platform
        const detection = await detectATSPlatform(url);
        console.log(`\n✓ Platform detected: ${detection.platform}`);
        console.log(`  Method: ${detection.method}`);
        console.log(`  Slug: ${detection.slug || 'N/A'}`);

        if (detection.platform === 'unknown') {
            console.log('\n⚠ This company would need scraping (no API available)');
            return null;
        }

        // Fetch jobs based on platform
        let jobData = null;

        switch (detection.platform) {
            case 'greenhouse':
                console.log(`\n→ Calling Greenhouse API...`);
                jobData = await greenhouseAdapter.fetchJobs(detection.slug);
                break;

            case 'lever':
                console.log(`\n→ Calling Lever API...`);
                jobData = await leverAdapter.fetchJobs(detection.slug);
                break;

            case 'ashby':
                console.log(`\n→ Fetching from Ashby...`);
                jobData = await ashbyAdapter.fetchJobs(detection.slug);
                break;
        }

        if (jobData) {
            console.log(`\n✓ Successfully fetched ${jobData.totalJobs} jobs!`);
            console.log(`  Source: ${jobData.source}`);
            console.log(`  Company: ${jobData.companyName}`);
            console.log(`\n📁 Categories:`);

            for (const [category, jobs] of Object.entries(jobData.jobLinks)) {
                console.log(`  - ${category}: ${jobs.length} jobs`);
            }

            // Show first 3 jobs
            console.log(`\n📋 Sample jobs:`);
            const allJobs = Object.values(jobData.jobLinks).flat();
            allJobs.slice(0, 3).forEach((job, idx) => {
                console.log(`  ${idx + 1}. ${job.title}`);
                console.log(`     Location: ${job.location || 'N/A'}`);
                console.log(`     URL: ${job.url}`);
            });

            // Test fetching details for first job
            if (allJobs.length > 0) {
                console.log(`\n→ Testing detailed fetch for: "${allJobs[0].title}"`);

                let details = null;
                switch (detection.platform) {
                    case 'greenhouse':
                        details = await greenhouseAdapter.fetchJobDetails(detection.slug, allJobs[0].id);
                        break;
                    case 'lever':
                        details = await leverAdapter.fetchJobDetails(detection.slug, allJobs[0].id);
                        break;
                    case 'ashby':
                        details = await ashbyAdapter.fetchJobDetails(detection.slug, allJobs[0].id);
                        break;
                }

                if (details) {
                    console.log(`\n✓ Job details fetched successfully!`);
                    console.log(`  Title: ${details.title}`);
                    console.log(`  Role: ${details.primaryRole}`);
                    console.log(`  Type: ${details.positionType}`);
                    console.log(`  Location: ${details.locations} (${details.locationType})`);
                    console.log(`  Salary: ${details.salaryMin ? `$${details.salaryMin} - $${details.salaryMax}` : 'Not specified'}`);
                    console.log(`  Description length: ${details.description.length} characters`);
                    console.log(`  Keywords: ${details.keywords || 'None extracted'}`);
                }
            }

            return jobData;
        }

        return null;

    } catch (error) {
        console.error(`\n✗ Error: ${error.message}`);
        return null;
    }
}

/**
 * Test with companies from your database
 */
async function testFromDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const companies = await Company.find().limit(5);

        console.log(`Found ${companies.length} companies in database`);
        console.log('Testing first 5...\n');

        for (const company of companies) {
            await testURL(company.jobWebsite, company.name);
            console.log('\n'); // spacing
        }

        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');

    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * Test with hardcoded examples
 */
async function testExamples() {
    const testCases = [
        {
            name: 'Anthropic (Greenhouse)',
            url: 'https://job-boards.greenhouse.io/anthropic'
        },
        {
            name: 'Abridge (Ashby)',
            url: 'https://jobs.ashbyhq.com/abridge'
        },
        {
            name: 'Cohere (Ashby)',
            url: 'https://jobs.ashbyhq.com/cohere'
        }
    ];

    for (const testCase of testCases) {
        await testURL(testCase.url, testCase.name);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length > 0) {
    // Test a specific URL
    testURL(args[0], args[1]).catch(console.error);
} else if (process.env.MONGODB_URI) {
    // Test from database
    testFromDatabase().catch(console.error);
} else {
    // Test with examples
    console.log('No MongoDB URI found, testing with examples...\n');
    testExamples().catch(console.error);
}
