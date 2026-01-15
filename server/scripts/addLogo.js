const mongoose = require('mongoose');
const Job = require('../models/Job');
const Company = require('../models/Company');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function addCompanyLogo(companyName, logoUrl) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // First, update the Company table
        const company = await Company.findOne({ name: companyName });

        if (!company) {
            console.log(`Company not found: ${companyName}`);
            return;
        }

        if (company.logo !== logoUrl) {
            company.logo = logoUrl;
            await company.save();
            console.log(`✓ Updated logo in Company table for: ${companyName}`);
        } else {
            console.log(`✓ Company already has this logo: ${companyName}`);
        }

        // Now update all jobs for this company
        const jobs = await Job.find({ company: companyName });

        if (jobs.length === 0) {
            console.log(`No jobs found for company: ${companyName}`);
            return;
        }

        console.log(`\nFound ${jobs.length} jobs for ${companyName}`);

        // Update each job with the logo URL
        let updatedCount = 0;
        for (const job of jobs) {
            if (job.companyLogo == "null" || job.companyLogo != logoUrl) {
                job.companyLogo = logoUrl;
                await job.save();
                updatedCount++;
            }
        }

        console.log(`\n✓ Updated ${updatedCount} job(s) with logo`);
        console.log(`✓ Skipped ${jobs.length - updatedCount} job(s) that already had the logo`);

    } catch (error) {
        console.error('Error updating jobs:', error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Example usage - replace these values with your actual company name and logo URL
const COMPANY_NAME = 'Ethereum Foundation';
const LOGO_URL = "dahttps://app.ashbyhq.com/api/images/org-theme-logo/cbfdd8f2-88d7-4b84-99df-759dda26e439/e9838ba0-75c9-4302-abf2-4f823e50296b/1c54dd81-57da-48c8-8d73-84932bfbd1f9.png"
addCompanyLogo(COMPANY_NAME, LOGO_URL);