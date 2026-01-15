const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    website: { type: String, required: true },
    jobWebsite: { type: String, required: true },
    numOfJobs: { type: String, required: true },
    logo: { type: String, required: false, default: '' },
    indexed: { type: String },
    platform: {
        type: String,
        enum: ['greenhouse', 'lever', 'ashby', 'unknown'],
        default: 'unknown'
    },
    categories: {
        type: [String],
        enum: ['AI', 'Crypto', 'Web3', 'Fintech', 'DevTools', 'Data', 'Security', 'Infrastructure', 'SaaS', 'Other'],
        default: []
    },
    lastSyncedAt: { type: Date }
}, { timestamps: true })

const Company = mongoose.model('Company', companySchema);

module.exports = Company;