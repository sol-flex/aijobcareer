const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Job = require('../models/Job');
const Company = require('../models/Company');

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);

    const company = await Company.findOne({ name: 'Writer' });
    console.log('Company name:', company.name);
    console.log('Company name type:', typeof company.name);
    console.log('Company name length:', company.name.length);

    // Test the regex construction
    const companyNameEscaped = company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    console.log('\nEscaped:', companyNameEscaped);

    const regex = new RegExp('^' + companyNameEscaped + '$', 'i');
    console.log('Regex:', regex);

    // Test exact match
    const exactMatch = await Job.find({
        company: company.name,
        deprecated: false
    });
    console.log('\nExact match results:', exactMatch.length);

    // Test regex match
    const regexMatch = await Job.find({
        company: { $regex: regex },
        deprecated: false
    });
    console.log('Regex match results:', regexMatch.length);

    // Show all distinct company values for jobs matching /writer/i
    const allMatches = await Job.find({
        company: { $regex: /writer/i }
    });

    const distinctValues = [...new Set(allMatches.map(j => j.company))];
    console.log('\nDistinct company field values matching /writer/i:');
    distinctValues.forEach(v => {
        const count = allMatches.filter(j => j.company === v).length;
        console.log(`  '${v}' (${count} jobs)`);
    });

    await mongoose.disconnect();
}

debug();
