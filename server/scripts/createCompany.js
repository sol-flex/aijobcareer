const mongoose = require('mongoose');
const Company = require('../models/Company');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createCompany(companyObj) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all jobs for the specified company
        const company = await Company.find({ name: companyObj.name });
        
        if (company.length != 0) {
            console.log(`Company ${companyObj.name} already exists`);
            return;
        } else {
            const company = new Company(companyObj);
            await company.save();
            console.log(`Successfully created company: ${companyObj.name}`);
            
            // Log the saved company data
            console.log('\nSaved Company Data:');
            console.log(JSON.stringify(companyObj, null, 2));
        }

    } catch (error) {
        console.error('Error updating jobs:', error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Example usage - replace these values with your actual company name and logo URL
const name = 'Writer';
const logo = "data:image/png;base64,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"
const jobWebsite = "https://jobs.ashbyhq.com/writer"
const website = "https://jobs.ashbyhq.com/writer"
const numOfJobs = 165;

createCompany({ name, logo, jobWebsite, website, numOfJobs });