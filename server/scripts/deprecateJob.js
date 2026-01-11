const mongoose = require('mongoose');
const path = require('path');
const Job = require('../models/Job');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const deprecateJob = async (jobId) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const job = await Job.findById(jobId);

        if (!job) {
            console.log('Job not found');
            await mongoose.disconnect();
            return;
        }

        job.deprecated = true;
        job.deprecatedAt = new Date();
        await job.save();

        console.log(`Job deprecated: ${job.title} at ${job.company}`);

        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
    }
};

const jobId = process.argv[2];

if (!jobId) {
    console.log('Please provide a job ID');
    process.exit(1);
}

deprecateJob(jobId);
