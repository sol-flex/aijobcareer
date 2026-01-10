/**
 * Update Company Platforms
 *
 * Loops through all companies and sets the platform field
 * based on their jobWebsite URL
 *
 * Usage: node updateCompanyPlatforms.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Company = require('../models/Company');

/**
 * Detect ATS platform from URL
 */
function detectPlatform(url) {
    if (!url) return 'unknown';

    const urlLower = url.toLowerCase();

    if (urlLower.includes('greenhouse.io')) return 'greenhouse';
    if (urlLower.includes('lever.co')) return 'lever';
    if (urlLower.includes('ashbyhq.com')) return 'ashby';

    return 'unknown';
}

async function updateCompanyPlatforms() {
    try {
        console.log('='.repeat(70));
        console.log('UPDATE COMPANY PLATFORMS');
        console.log('='.repeat(70));
        console.log('');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get all companies
        const companies = await Company.find({});
        console.log(`Found ${companies.length} companies\n`);

        let stats = {
            greenhouse: 0,
            lever: 0,
            ashby: 0,
            unknown: 0
        };

        console.log('Updating platforms...');
        console.log('-'.repeat(70));

        for (const company of companies) {
            const platform = detectPlatform(company.jobWebsite);

            console.log(`${company.name.padEnd(30)} → ${platform.padEnd(12)} (${company.jobWebsite})`);

            company.platform = platform;
            await company.save();

            stats[platform]++;
        }

        console.log('\n' + '='.repeat(70));
        console.log('SUMMARY');
        console.log('='.repeat(70));
        console.log(`Total companies: ${companies.length}`);
        console.log(`\nBy platform:`);
        console.log(`  Greenhouse: ${stats.greenhouse}`);
        console.log(`  Lever: ${stats.lever}`);
        console.log(`  Ashby: ${stats.ashby}`);
        console.log(`  Unknown: ${stats.unknown}`);
        console.log('\n✓ All companies updated!');

    } catch (error) {
        console.error('\n✗ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

// Run the update
updateCompanyPlatforms();
