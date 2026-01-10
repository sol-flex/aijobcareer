const mongoose = require('mongoose');
const Job = require('../models/Job');
require('dotenv').config();

async function updateFireblocksLogos() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // The logo URL you want to set
        const newLogoUrl = "https://assets.kraken.com/marketing/static/kraken-logo.jpg";

        // Update all Fireblocks jobs
        const result = await Job.updateMany(
            { company: "Kraken" }, // filter
            { $set: { companyLogo: newLogoUrl } } // update
        );

        console.log(`Updated ${result.modifiedCount} Fireblocks jobs`);
        console.log(`Matched ${result.matchedCount} documents`);

    } catch (error) {
        console.error('Error updating logos:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the update
updateFireblocksLogos().catch(console.error);