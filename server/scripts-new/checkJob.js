const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Job = require('../models/Job');

async function checkJob() {
    await mongoose.connect(process.env.MONGODB_URI);

    const job = await Job.findById('69617611be4f021f71d25d77');

    console.log('Job Details:');
    console.log('='.repeat(70));
    console.log('Title:', job.title);
    console.log('Company:', job.company);
    console.log('');
    console.log('LOCATION FIELDS:');
    console.log('  locations:', job.locations);
    console.log('  location:', job.location);
    console.log('  country:', job.country);
    console.log('  locationType:', job.locationType);
    console.log('');
    console.log('Full job object:');
    console.log(JSON.stringify(job, null, 2));

    await mongoose.disconnect();
}

checkJob();
