const mongoose = require('mongoose');
const Job = require('../models/Job');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function addCompanyLogo(companyName, logoUrl) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all jobs for the specified company
        const jobs = await Job.find({ company: companyName });
        
        if (jobs.length === 0) {
            console.log(`No jobs found for company: ${companyName}`);
            return;
        }

        console.log(`Found ${jobs.length} jobs for ${companyName}`);

        // Update each job with the logo URL
        for (const job of jobs) {
            if (job.companyLogo == "null" || job.companyLogo != logoUrl) {
                job.companyLogo = logoUrl;
                await job.save();
                console.log(`Added logo to job: ${job.title}`);
            } else {
                console.log(`Job already has logo: ${job.title}`);
            }
        }

        console.log('All jobs updated successfully');

    } catch (error) {
        console.error('Error updating jobs:', error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Example usage - replace these values with your actual company name and logo URL
const COMPANY_NAME = 'Glean';
const LOGO_URL = "https://pbs.twimg.com/profile_images/1833980340085686275/z8j8a10l_400x400.png"

addCompanyLogo(COMPANY_NAME, LOGO_URL);