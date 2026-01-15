const mongoose = require('mongoose');
const path = require('path');
const Company = require('../models/Company');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Known AI companies - add to this list
const aiCompanies = [
    'Anthropic', 'OpenAI', 'Perplexity AI', 'Cohere', 'Mistral AI',
    'Hugging Face', 'Stability AI', 'Runway', 'ElevenLabs', 'Synthesia',
    'Harvey', 'Hebbia', 'Glean', 'Writer', 'Jasper',
    'LlamaIndex', 'Langchain', 'Together AI', 'Fireworks AI', 'Baseten',
    'Replicate', 'Modal', 'Anyscale', 'Scale AI', 'Weights & Biases',
    'Figure', 'Skild AI', 'World Labs', 'Pika', 'Suno',
    'Mercor', 'Captions', 'DeepL', 'Speak', 'Abridge',
    'World', 'Windsurf'
];

// DevTools/Infrastructure companies
const devToolsCompanies = [
    'Vercel', 'Replit', 'StackBlitz', 'GitLab', 'Linear',
    'Temporal', 'Windsurf', 'Cursor'
];

// Data/Analytics companies
const dataCompanies = [
    'Databricks', 'Snowflake', 'Fivetran', 'dbt Labs'
];

// Cloud/Infrastructure
const infrastructureCompanies = [
    'Crusoe', 'Lambda', 'CoreWeave', 'Together AI', 'Fireworks AI',
    'Baseten', 'Modal', 'Replicate'
];

async function categorizeCompanies() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Get all companies without categories
        const companies = await Company.find({
            $or: [
                { categories: { $exists: false } },
                { categories: { $size: 0 } }
            ]
        });

        console.log(`Found ${companies.length} companies to categorize\n`);

        let updatedCount = 0;

        for (const company of companies) {
            const categories = [];

            // Check AI
            if (aiCompanies.some(name => company.name.includes(name) || name.includes(company.name))) {
                categories.push('AI');
            }

            // Check DevTools
            if (devToolsCompanies.some(name => company.name.includes(name) || name.includes(company.name))) {
                categories.push('DevTools');
            }

            // Check Data
            if (dataCompanies.some(name => company.name.includes(name) || name.includes(company.name))) {
                categories.push('Data');
            }

            // Check Infrastructure
            if (infrastructureCompanies.some(name => company.name.includes(name) || name.includes(company.name))) {
                categories.push('Infrastructure');
            }

            // If no categories matched, mark as Other for manual review
            if (categories.length === 0) {
                categories.push('Other');
            }

            company.categories = categories;
            await company.save();

            console.log(`✅ ${company.name}: [${categories.join(', ')}]`);
            updatedCount++;
        }

        console.log(`\n📊 Summary: Updated ${updatedCount} companies`);

        await mongoose.disconnect();
        console.log('\n✅ MongoDB Disconnected');

    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

categorizeCompanies();
