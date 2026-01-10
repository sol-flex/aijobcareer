/**
 * Delete the old test job and save a fresh one with proper HTML
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Job = require('../models/Job');
const Company = require('../models/Company');
const greenhouseAdapter = require('./adapters/greenhouseAdapter');

async function testSaveFresh() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Delete the old test job we saved earlier
        const deleteResult = await Job.deleteOne({
            applicationUrl: 'https://job-boards.greenhouse.io/gleanwork/jobs/4613925005',
            createdAt: { $gte: new Date('2026-01-09') } // Only delete today's test
        });

        if (deleteResult.deletedCount > 0) {
            console.log(`✓ Deleted old test job\n`);
        }

        // Get company logo
        const company = await Company.findOne({ name: 'Glean' });
        const companyLogo = company?.logo || null;

        // Fetch job details with new HTML approach
        console.log('Fetching job with new HTML-based approach...');
        const jobDetails = await greenhouseAdapter.fetchJobDetails('gleanwork', '4613925005');

        // Add company info
        jobDetails.company = 'Glean';
        jobDetails.companyLogo = companyLogo;

        console.log('\n' + '='.repeat(70));
        console.log('JOB DETAILS TO SAVE:');
        console.log('='.repeat(70));
        console.log(`Company: ${jobDetails.company}`);
        console.log(`Title: ${jobDetails.title}`);
        console.log(`Role: ${jobDetails.primaryRole}`);
        console.log(`Location: ${jobDetails.locations}`);
        console.log(`Description format: HTML (${jobDetails.description.length} chars)`);
        console.log(`Contains <div> tags: ${jobDetails.description.includes('<div>') ? 'YES ✓' : 'NO'}`);
        console.log(`Contains <ul> tags: ${jobDetails.description.includes('<ul>') ? 'YES ✓' : 'NO'}`);
        console.log(`Contains inline styles: ${jobDetails.description.includes('style=') ? 'YES ✓' : 'NO'}`);

        // Save to database
        console.log('\nSaving to database...');
        const job = new Job(jobDetails);
        await job.save();

        console.log('\n✓ SUCCESS! Job saved with HTML description');
        console.log(`MongoDB ID: ${job._id}`);
        console.log(`Created: ${job.createdAt}`);

        // Verify what was saved
        console.log('\n' + '='.repeat(70));
        console.log('VERIFICATION - Reading back from database:');
        console.log('='.repeat(70));

        const savedJob = await Job.findById(job._id);
        console.log(`Title: ${savedJob.title}`);
        console.log(`Description length: ${savedJob.description.length} characters`);
        console.log(`First 300 chars of description:\n`);
        console.log(savedJob.description.substring(0, 300));
        console.log('\n...[truncated]...');

        console.log('\n' + '='.repeat(70));
        console.log('NEXT STEPS:');
        console.log('='.repeat(70));
        console.log('1. In your React frontend, render this job using:');
        console.log('   <div dangerouslySetInnerHTML={{ __html: job.description }} />');
        console.log('');
        console.log('2. Or use html-react-parser for safer rendering:');
        console.log('   import parse from "html-react-parser";');
        console.log('   <div>{parse(job.description)}</div>');
        console.log('');
        console.log('3. The HTML is already styled and structured - no conversion needed!');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('\nError:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

testSaveFresh();
