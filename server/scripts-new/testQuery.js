const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Job = require('../models/Job');
const Company = require('../models/Company');

async function testQuery() {
    await mongoose.connect(process.env.MONGODB_URI);

    const company = await Company.findOne({ name: 'Writer' });

    console.log('Testing the EXACT query from dailySyncJobs.js:\n');

    // This is the NEW code I added
    const companyNameEscaped = company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingJobs = await Job.find({
        company: { $regex: new RegExp('^' + companyNameEscaped + '$', 'i') },
        deprecated: false
    });

    console.log(`Found ${existingJobs.length} jobs`);
    console.log('\nJob URLs:');
    existingJobs.forEach((j, i) => {
        console.log(`${i + 1}. ${j.title}`);
        console.log(`   ${j.applicationUrl}`);
    });

    await mongoose.disconnect();
}

testQuery();
