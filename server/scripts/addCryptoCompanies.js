const mongoose = require('mongoose');
const path = require('path');
const Company = require('../models/Company');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const cryptoCompanies = [
    { name: 'Rain', website: 'rain.bh', jobWebsite: 'jobs.ashbyhq.com/rain' },
    { name: 'Fireblocks', website: 'fireblocks.com', jobWebsite: 'job-boards.greenhouse.io/fireblocks' },
    { name: 'Anchorage Digital', website: 'anchorage.com', jobWebsite: 'jobs.lever.co/anchorage' },
    { name: 'Solana Foundation', website: 'solana.com', jobWebsite: 'greenhouse.io/solanafoundation' },
    { name: 'Ethereum Foundation', website: 'ethereum.org', jobWebsite: 'jobs.ashbyhq.com/ethereum-foundation' },
    { name: 'Circle', website: 'circle.com', jobWebsite: 'careers.circle.com' },
    { name: 'Alchemy', website: 'alchemy.com', jobWebsite: 'job-boards.greenhouse.io/alchemy' },
    { name: 'Aptos Labs', website: 'aptoslabs.com', jobWebsite: 'job-boards.greenhouse.io/aptoslabs' },
    { name: 'Near Foundation', website: 'near.org', jobWebsite: 'near.foundation/careers' },
    { name: 'Polymarket', website: 'polymarket.com', jobWebsite: 'jobs.ashbyhq.com/polymarket' },
    { name: 'Kalshi', website: 'kalshi.com', jobWebsite: 'jobs.ashbyhq.com/kalshi' },
    { name: 'Coinbase', website: 'coinbase.com', jobWebsite: 'coinbase.com/careers' },
    { name: 'Robinhood', website: 'robinhood.com', jobWebsite: 'robinhood.com/careers' },
    { name: 'Avalanche', website: 'avax.network', jobWebsite: 'job-boards.greenhouse.io/avalabs' },
    { name: 'Gemini', website: 'gemini.com', jobWebsite: 'gemini.com/careers' },
    { name: 'OKX', website: 'okx.com', jobWebsite: 'job-boards.greenhouse.io/OKX' },
    { name: 'Binance', website: 'binance.com', jobWebsite: 'binance.com/careers' },
    { name: 'World', website: 'worldcoin.org', jobWebsite: 'ashbyhq.com/Tools-for-Humanity' },
    { name: 'Polygon', website: 'polygon.technology', jobWebsite: 'polygon.technology/careers' },
    { name: 'Arbitrum', website: 'arbitrum.io', jobWebsite: 'greenhouse.io/offchainlabs' },
    { name: 'Optimism', website: 'optimism.io', jobWebsite: 'jobs.ashbyhq.com/oplabs' },
    { name: 'Uniswap Labs', website: 'uniswap.org', jobWebsite: 'greenhouse.io/uniswaplabs' },
    { name: 'Phantom', website: 'phantom.app', jobWebsite: 'jobs.ashbyhq.com/phantom' },
    { name: 'Ripple', website: 'ripple.com', jobWebsite: 'ripple.com/careers/all-jobs' },
    { name: 'Tether', website: 'tether.to', jobWebsite: 'tether.to/en/careers' },
    { name: 'Kraken', website: 'kraken.com', jobWebsite: 'jobs.ashbyhq.com/kraken.com' },
    { name: 'Grayscale', website: 'grayscale.com', jobWebsite: 'greenhouse.io/grayscaleinvestments' },
    { name: 'Monad', website: 'monad.xyz', jobWebsite: 'jobs.ashbyhq.com/monad.foundation' },
    { name: 'Bitgo', website: 'bitgo.com', jobWebsite: 'job-boards.greenhouse.io/bitgo' },
    { name: 'Consensys', website: 'consensys.io', jobWebsite: 'job-boards.greenhouse.io/consensys' }
];

// Detect platform from jobWebsite URL
function detectPlatform(jobWebsite) {
    if (jobWebsite.includes('greenhouse')) return 'greenhouse';
    if (jobWebsite.includes('lever')) return 'lever';
    if (jobWebsite.includes('ashby')) return 'ashby';
    return 'unknown';
}

// Add https:// if not present
function normalizeUrl(url) {
    if (!url.startsWith('http')) {
        return `https://${url}`;
    }
    return url;
}

async function addCryptoCompanies() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        let addedCount = 0;
        let skippedCount = 0;

        for (const company of cryptoCompanies) {
            // Check if company already exists
            const existing = await Company.findOne({ name: company.name });

            if (existing) {
                console.log(`⏭️  Skipped: ${company.name} (already exists)`);
                skippedCount++;
                continue;
            }

            // Create new company
            const newCompany = new Company({
                name: company.name,
                website: normalizeUrl(company.website),
                jobWebsite: normalizeUrl(company.jobWebsite),
                platform: detectPlatform(company.jobWebsite),
                categories: ['Crypto', 'Web3'],
                numOfJobs: '0',
                logo: '',
                indexed: 'false'
            });

            await newCompany.save();
            console.log(`✅ Added: ${company.name} (${newCompany.platform})`);
            addedCount++;
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Added: ${addedCount}`);
        console.log(`   Skipped: ${skippedCount}`);
        console.log(`   Total: ${cryptoCompanies.length}`);

        await mongoose.disconnect();
        console.log('\n✅ MongoDB Disconnected');

    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

addCryptoCompanies();
