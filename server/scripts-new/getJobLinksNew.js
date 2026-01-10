const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Company = require('../models/Company');
const Job = require('../models/Job');

const { detectATSPlatform } = require('./atsDetector');
const greenhouseAdapter = require('./adapters/greenhouseAdapter');
const leverAdapter = require('./adapters/leverAdapter');
const ashbyAdapter = require('./adapters/ashbyAdapter');

/**
 * New job fetching system that uses APIs first, scraping as fallback
 */

/**
 * Fetch jobs using the appropriate adapter
 */
async function fetchJobsForCompany(company) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Processing: ${company.name}`);
    console.log(`Career page: ${company.jobWebsite}`);
    console.log('='.repeat(60));

    try {
        // Detect which platform this company uses
        const detection = await detectATSPlatform(company.jobWebsite);
        console.log(`Detected platform: ${detection.platform} (method: ${detection.method})`);

        let jobData = null;

        // Route to appropriate adapter
        switch (detection.platform) {
            case 'greenhouse':
                jobData = await greenhouseAdapter.fetchJobs(detection.slug);
                break;

            case 'lever':
                jobData = await leverAdapter.fetchJobs(detection.slug);
                break;

            case 'ashby':
                jobData = await ashbyAdapter.fetchJobs(detection.slug);
                break;

            case 'rss':
                console.log('RSS feed detected, but not implemented yet');
                console.log('Falling back to scraping...');
                return null;

            default:
                console.log('No API available, would need to scrape');
                return null;
        }

        if (jobData) {
            console.log(`✓ Successfully fetched ${jobData.totalJobs} jobs via ${jobData.source}`);
            console.log(`Categories found: ${Object.keys(jobData.jobLinks).join(', ')}`);

            return jobData;
        }

        return null;

    } catch (error) {
        console.error(`✗ Error fetching jobs: ${error.message}`);
        return null;
    }
}

/**
 * Process and save jobs to database
 */
async function saveJobsToDatabase(jobData, company) {
    let jobsAdded = 0;
    let jobsSkipped = 0;
    let jobsUpdated = 0;

    console.log(`\nSaving jobs to database...`);

    for (const [category, jobs] of Object.entries(jobData.jobLinks)) {
        console.log(`\nProcessing category: ${category} (${jobs.length} jobs)`);

        for (const jobSummary of jobs) {
            try {
                // Check if job already exists
                const existingJob = await Job.findOne({
                    applicationUrl: jobSummary.url
                });

                if (existingJob) {
                    // Update logo if missing
                    if ((!existingJob.companyLogo || existingJob.companyLogo === 'null') && company.logo) {
                        existingJob.companyLogo = company.logo;
                        await existingJob.save();
                        jobsUpdated++;
                        console.log(`  ↻ Updated logo: ${existingJob.title}`);
                    } else {
                        jobsSkipped++;
                        console.log(`  ⊘ Already exists: ${jobSummary.title}`);
                    }
                    continue;
                }

                // Fetch full job details
                console.log(`  ↓ Fetching details for: ${jobSummary.title}`);

                let jobDetails = null;

                // Extract slug and ID from URL for API calls
                const detection = await detectATSPlatform(company.jobWebsite);

                switch (detection.platform) {
                    case 'greenhouse':
                        jobDetails = await greenhouseAdapter.fetchJobDetails(
                            detection.slug,
                            jobSummary.id
                        );
                        break;

                    case 'lever':
                        jobDetails = await leverAdapter.fetchJobDetails(
                            detection.slug,
                            jobSummary.id
                        );
                        break;

                    case 'ashby':
                        jobDetails = await ashbyAdapter.fetchJobDetails(
                            detection.slug,
                            jobSummary.id
                        );
                        break;
                }

                if (jobDetails) {
                    // Add company logo from database
                    if (company.logo) {
                        jobDetails.companyLogo = company.logo;
                    }

                    // Ensure company name is correct
                    jobDetails.company = company.name;

                    // Create and save job
                    const job = new Job(jobDetails);
                    await job.save();

                    jobsAdded++;
                    console.log(`  ✓ Added: ${jobDetails.title}`);
                } else {
                    console.log(`  ✗ Could not fetch details for: ${jobSummary.title}`);
                }

                // Add a small delay to be respectful to APIs
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`  ✗ Error processing job: ${error.message}`);
            }
        }
    }

    console.log(`\nSummary for ${company.name}:`);
    console.log(`  ✓ Added: ${jobsAdded}`);
    console.log(`  ↻ Updated: ${jobsUpdated}`);
    console.log(`  ⊘ Skipped: ${jobsSkipped}`);

    return { jobsAdded, jobsUpdated, jobsSkipped };
}

/**
 * Main execution function
 */
async function main() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch all companies from database
        const companies = await Company.find();
        console.log(`Found ${companies.length} companies in database\n`);

        let totalProcessed = 0;
        let totalAdded = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;

        for (const company of companies) {
            // Skip if already updated today
            const updatedAt = new Date(company.updatedAt);
            if (updatedAt >= today) {
                console.log(`⊘ Skipping ${company.name} - already updated today`);
                continue;
            }

            try {
                // Fetch jobs using API
                const jobData = await fetchJobsForCompany(company);

                if (jobData) {
                    // Save to database
                    const stats = await saveJobsToDatabase(jobData, company);

                    totalAdded += stats.jobsAdded;
                    totalUpdated += stats.jobsUpdated;
                    totalSkipped += stats.jobsSkipped;

                    // Update company timestamp
                    await Company.findByIdAndUpdate(company._id, {
                        indexed: true,
                        numOfJobs: jobData.totalJobs.toString(),
                        updatedAt: new Date()
                    });

                    totalProcessed++;
                } else {
                    console.log(`⊘ No jobs fetched for ${company.name}`);

                    // Log to file for companies that need scraping
                    const logMessage = `${new Date().toISOString()} - ${company.name} requires scraping: ${company.jobWebsite}\n`;
                    fs.appendFileSync('needs-scraping.txt', logMessage);
                }

            } catch (error) {
                console.error(`✗ Error processing ${company.name}: ${error.message}`);

                // Log errors
                const logMessage = `${new Date().toISOString()} - Error with ${company.name}: ${error.message}\n`;
                fs.appendFileSync('errors.txt', logMessage);
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log('FINAL SUMMARY');
        console.log('='.repeat(60));
        console.log(`Companies processed: ${totalProcessed}`);
        console.log(`Jobs added: ${totalAdded}`);
        console.log(`Jobs updated: ${totalUpdated}`);
        console.log(`Jobs skipped: ${totalSkipped}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    fetchJobsForCompany,
    saveJobsToDatabase
};
