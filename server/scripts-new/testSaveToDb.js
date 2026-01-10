/**
 * Test script to save first 2 Glean jobs to database
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Job = require('../models/Job');
const Company = require('../models/Company');
const greenhouseAdapter = require('./adapters/greenhouseAdapter');

async function testSaveGleanJobs() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Fetch Glean jobs
        console.log('Fetching jobs from Glean via Greenhouse API...');
        const jobData = await greenhouseAdapter.fetchJobs('gleanwork');

        console.log(`✓ Fetched ${jobData.totalJobs} jobs\n`);

        // Get first 2 jobs
        const allJobs = Object.values(jobData.jobLinks).flat();
        const firstTwoJobs = allJobs.slice(0, 2);

        console.log('Will save these 2 jobs:');
        firstTwoJobs.forEach((job, idx) => {
            console.log(`  ${idx + 1}. ${job.title} (${job.location})`);
        });
        console.log('');

        // Try to find Glean company in database for logo
        let companyLogo = null;
        const company = await Company.findOne({ name: 'Glean' });
        if (company && company.logo) {
            companyLogo = company.logo;
            console.log(`✓ Found company logo: ${companyLogo}\n`);
        } else {
            console.log('⚠ No company logo found in database\n');
        }

        // Save each job
        for (let i = 0; i < firstTwoJobs.length; i++) {
            const jobSummary = firstTwoJobs[i];

            console.log(`\n${'='.repeat(70)}`);
            console.log(`Processing Job ${i + 1}: ${jobSummary.title}`);
            console.log('='.repeat(70));

            // Check if job already exists
            const existingJob = await Job.findOne({
                applicationUrl: jobSummary.url
            });

            if (existingJob) {
                console.log('⚠ Job already exists in database');
                console.log(`  Title: ${existingJob.title}`);
                console.log(`  Company: ${existingJob.company}`);
                console.log(`  ID: ${existingJob._id}`);
                console.log(`  Created: ${existingJob.createdAt}`);
                continue;
            }

            // Fetch full job details
            console.log('Fetching full job details...');
            const jobDetails = await greenhouseAdapter.fetchJobDetails(
                'gleanwork',
                jobSummary.id
            );

            // Add company logo if we have it
            if (companyLogo) {
                jobDetails.companyLogo = companyLogo;
            }

            // Ensure company name is "Glean" not "gleanwork"
            jobDetails.company = 'Glean';

            console.log('\nJob details to save:');
            console.log(`  Company: ${jobDetails.company}`);
            console.log(`  Title: ${jobDetails.title}`);
            console.log(`  Role: ${jobDetails.primaryRole}`);
            console.log(`  Type: ${jobDetails.positionType}`);
            console.log(`  Location: ${jobDetails.locations} (${jobDetails.locationType})`);
            console.log(`  Country: ${jobDetails.country}`);
            console.log(`  Salary: ${jobDetails.salaryMin && jobDetails.salaryMax ? `$${jobDetails.salaryMin.toLocaleString()} - $${jobDetails.salaryMax.toLocaleString()}` : 'Not specified'}`);
            console.log(`  Application URL: ${jobDetails.applicationUrl}`);
            console.log(`  Description length: ${jobDetails.description.length} characters`);
            console.log(`  Keywords: ${jobDetails.keywords || 'None'}`);

            // Create and save job
            console.log('\nSaving to database...');
            const job = new Job(jobDetails);
            await job.save();

            console.log('✓ SUCCESS! Job saved to database');
            console.log(`  MongoDB ID: ${job._id}`);
            console.log(`  Created at: ${job.createdAt}`);

            // Small delay between saves
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`\n\n${'='.repeat(70)}`);
        console.log('TEST COMPLETE');
        console.log('='.repeat(70));
        console.log(`Jobs processed: ${firstTwoJobs.length}`);

        // Count total Glean jobs in database
        const totalGleanJobs = await Job.countDocuments({ company: 'Glean' });
        console.log(`Total Glean jobs now in database: ${totalGleanJobs}`);

    } catch (error) {
        console.error('\n✗ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

testSaveGleanJobs();
