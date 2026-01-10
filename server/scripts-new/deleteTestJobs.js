const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Job = require('../models/Job');

async function deleteJobs() {
    await mongoose.connect(process.env.MONGODB_URI);

    const result = await Job.deleteMany({
        _id: { $in: ['696173e1f51f8bd414d308c8', '696173f7f51f8bd414d308cb'] }
    });

    console.log(`Deleted ${result.deletedCount} test jobs`);
    await mongoose.disconnect();
}

deleteJobs();
