const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Job = require('../models/Job');
const Company = require('../models/Company');

async function testDeletionLogic() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Get Writer company
    const company = await Company.findOne({ name: 'Writer' });
    console.log('Company name in database:', company.name);

    // Check with case-insensitive search (new logic)
    const companyNameEscaped = company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingJobs = await Job.find({
        company: { $regex: new RegExp('^' + companyNameEscaped + '$', 'i') },
        deprecated: false
    });

    console.log(`\nFound ${existingJobs.length} Writer jobs with case-insensitive search:`);
    existingJobs.forEach(j => {
        console.log(`  - ${j.title}`);
        console.log(`    URL: ${j.applicationUrl}`);
    });

    // Check if the specific job exists
    const specificJob = existingJobs.find(j =>
        j.applicationUrl === 'https://jobs.ashbyhq.com/writer/b222284f-030b-478c-87d7-ed4bae3fbcac'
    );

    if (specificJob) {
        console.log(`\n✓ The specific job you mentioned WAS found!\n`);
        console.log('  Title:', specificJob.title);
        console.log('  Company field:', specificJob.company);
        console.log('  Created:', specificJob.createdAt);
        console.log('\n  → This job would now be detected and deleted if missing from API');
    } else {
        console.log(`\n✗ The specific job was not found\n`);
    }

    await mongoose.disconnect();
}

testDeletionLogic();
