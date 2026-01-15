const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const path = require('path');
const { OpenAI } = require('openai');
const puppeteer = require('puppeteer');
const { parseJobWithAI } = require('./jobScraper');
const { getJobLinks } = require('./getJobLinks');
const Job = require('../models/Job');
const Company = require('../models/Company');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Main function to refresh crypto jobs
const main = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Get only crypto companies from database with known platforms
        const companies = await Company.find({
            categories: 'Crypto',
            platform: { $in: ['greenhouse', 'lever', 'ashby'] }
        });

        const totalCrypto = await Company.countDocuments({ categories: 'Crypto' });
        const unknownPlatforms = await Company.countDocuments({
            categories: 'Crypto',
            platform: 'unknown'
        });

        console.log(`Total crypto companies: ${totalCrypto}`);
        console.log(`With known platforms: ${companies.length}`);
        console.log(`Skipping (unknown platforms): ${unknownPlatforms}\n`);

        for (const company of companies) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`Processing: ${company.name}`);
            console.log(`${'='.repeat(60)}`);

            try {
                // Get all jobs from this company's website
                const { jobLinks, companyName } = await getJobLinks(company.jobWebsite);

                console.log(`Found job links for ${Object.keys(jobLinks).length} categories`);

                // Get existing jobs from database for this company
                const existingJobs = await Job.find({ company: company.name });
                const existingJobUrls = new Set(existingJobs.map(job => job.applicationUrl));

                console.log(`Existing jobs in DB: ${existingJobs.length}`);

                // Collect all current job URLs from the scraped data
                const currentJobUrls = new Set();
                for(const urls of Object.values(jobLinks)) {
                    urls.forEach(url => currentJobUrls.add(url));
                }

                console.log(`Current jobs on website: ${currentJobUrls.size}`);

                // Limit to only 4 jobs per company
                const limitedJobUrls = Array.from(currentJobUrls).slice(0, 4);
                console.log(`Limiting to first 4 jobs for this company`);

                // Mark jobs as deprecated if they're no longer on the website
                let deprecatedCount = 0;
                for(const existingJob of existingJobs) {
                    if(!currentJobUrls.has(existingJob.applicationUrl) && !existingJob.deprecated) {
                        existingJob.deprecated = true;
                        existingJob.deprecatedAt = new Date();

                        // Fix missing required fields for old jobs
                        if (!existingJob.country) existingJob.country = 'Not Specified';
                        if (!existingJob.locations) existingJob.locations = 'Not Specified';

                        await existingJob.save();
                        console.log(`  ❌ Deprecated: ${existingJob.title}`);
                        deprecatedCount++;
                    }
                }

                console.log(`\nDeprecated ${deprecatedCount} jobs`);

                // Add new jobs (limited to 4 per company)
                let newJobCount = 0;
                let processedCount = 0;

                outerLoop:
                for(const [category, urls] of Object.entries(jobLinks)) {
                    for(const url of urls) {
                        if(processedCount >= 4) {
                            console.log(`  ⏹️  Reached limit of 4 jobs, stopping...`);
                            break outerLoop;
                        }

                        const existingJob = existingJobUrls.has(url);

                        if(!existingJob) {
                            console.log(`  ➕ New job found, parsing: ${url}`);
                            const jobData = await parseJobWithAI(url, category);

                            if(jobData) {
                                const job = new Job(jobData);
                                await job.save();
                                console.log(`     ✅ Added: ${jobData.title}`);
                                newJobCount++;
                                processedCount++;
                            } else {
                                console.log(`     ⚠️  Failed to parse job data`);
                            }
                        } else {
                            processedCount++;
                        }
                    }
                }

                console.log(`Added ${newJobCount} new jobs`);

            } catch (error) {
                console.error(`❌ Error processing ${company.name}:`, error.message);
                continue; // Continue with next company
            }
        }

        await mongoose.disconnect();
        console.log('\n✅ MongoDB Disconnected Successfully');

    } catch(err) {
        console.log('❌ Fatal error:', err);
        await mongoose.disconnect();
    }
}

main();
