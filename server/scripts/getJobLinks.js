const axios = require('axios');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const Company = require('../models/Company');
const fs = require('fs');
require('dotenv').config();
const { parseJobWithAI, scrapeJobs } = require('./jobScraper');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function getJobLinksWithAI(html, baseUrl) {
    try {
        const $ = cheerio.load(html);
        
        // Clean the HTML content
        $('script').remove();
        $('style').remove();
        const cleanHtml = $.html();

        const prompt = `
        Analyze this careers/jobs page HTML and return a JSON object where:
        - Keys are job categories found on the page (e.g., "Engineering", "Marketing", "Sales", etc.)
        - Values are arrays of job posting URLs that belong to each category
        
        IMPORTANT INSTRUCTIONS:
        1. Identify all job categories present on the page
        2. Group job links under their appropriate categories
        3. Include ONLY absolute URLs. These are the URLs that start with "https://" or "http://"
        4. Ensure no job links are skipped
        5. If a job appears in multiple categories, include it in all relevant categories
        6. If no clear categories exist, use "All Positions" as the category
        7. Identify the name of the company. Use the URL to identify the company name or the company name from the page.
        8. Return ONLY the JSON object, no additional text
        9. Ensure that the URL is exactly like it appears on the page. Don't alter the URL in any way. (THIS IS IMPORTANT)
        10. Don't alter the URL by duplicating the company name in the URL path. (THIS IS IMPORTANT - THE URL SHOULD BE UNALTERED)
            For example DO NOT change https://jobs.ashbyhq.com/abridge/77e.. to https://jobs.ashbyhq.com/Abridge/abridge/77e..
            
        Before you start this task confirm to me that you will not alter the URLs found on the page in any way and that you returned absolute URLs. (rules 10 and 11)
        Before only returning the JSON object, confirm to me that you have not altered the URLs found on the page in any way and that you returned absolute URLs. (rules 10 and 11)
        but then only return the JSON object.
        
        Expected format:
        { companyName: "Name",
          jobLinks: {
            "Engineering": [
                "url1",
                "url2"
            ],
            "Marketing": [
                "url3",
                "url4"
            ]
          }   
        }
        
        HTML Content:
        ${cleanHtml}
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "You are a job link extraction specialist. Return only valid JSON array containing job posting URLs."
                },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        // Parse the response
        const response = JSON.parse(completion.choices[0].message.content);

        console.log(response);
        // Log results        
        return response;

    } catch (error) {
        console.error('Error extracting job links with AI:', error.message);
        return [];
    }
}

async function getJobLinks(url) {
    try {
        console.log(`\nScraping job links from: ${url}`);
        console.log('------------------------');


        // Launch Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Add a 5-second delay to ensure all content is fully loaded
        console.log('Waiting for 2 seconds...');
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000))); // Wait for 5 seconds

        // Get the page content after JS execution
        const html = await page.content();

        const links = await getJobLinksWithAI(html, url);
        
        console.log('------------------------\n');
        await browser.close();
        return links;

    } catch (error) {
        console.error('Error scraping job links:', error.message);
        return [];
    }
}

async function main() {
    // Connect to MongoDB once at the start
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    try {
        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch all companies from the database
        const companies = await Company.find();

        console.log(`Total companies found: ${companies.length}`);
        
        for (const company of companies) {
            // Convert the company's updatedAt to a Date object
            const updatedAt = new Date(company.updatedAt);
            
            // Skip if the company was updated today
            if (updatedAt >= today) {
                console.log(`Skipping ${company.name} - already updated today`);
                continue;
            }

            try {
                const {jobLinks, companyName} = await getJobLinks(company.jobWebsite);
    
                console.log(companyName, jobLinks)
        
                await scrapeJobs(jobLinks, companyName);

                await mongoose.connect(process.env.MONGODB_URI);
                console.log('Connected to MongoDB');            
        
                // Update company's indexed field to true after successful scraping
                await Company.findByIdAndUpdate(company._id, {
                    indexed: true,
                    updatedAt: new Date() // Update the updatedAt timestamp
                });

                console.log(`Successfully indexed jobs for ${companyName}`);
        
                console.log(`Total jobs found on ${company.jobWebsite}: ${jobLinks.length}`);
    
            } catch(err) {
                const timestamp = new Date().toISOString();
                const logMessage = `${timestamp} - Error parsing ${company.jobWebsite}: ${err.message}\n`;
                fs.appendFile('logs.txt', logMessage, (err) => {
                    if (err) console.error('Error writing to log file:', err);
                });
                console.error('Error scraping job links:', err.message);
                continue; // Continue to next company
            }
        }
        
    } catch(error) {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - Error in main process: ${error.message}\n`;
        fs.appendFile('logs.txt', logMessage, (err) => {
            if (err) console.error('Error writing to log file:', err);
        });
        console.error('Error in main process:', error.message);
    } finally {
        // Disconnect from MongoDB
        try {
            await mongoose.disconnect();
            console.log('MongoDB Disconnected Successfully');
        } catch (error) {
            console.error('Error disconnecting from MongoDB:', error.message);
        }
    }
}

// Run the script if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {getJobLinks, getJobLinksWithAI};

[
    "https://jobs.ashbyhq.com/abridge",
    "https://job-boards.greenhouse.io/anthropic",
    "https://jobs.ashbyhq.com/baseten/",
    "https://jobs.ashbyhq.com/captions",
    "https://jobs.ashbyhq.com/claylabs/",
    "https://job-boards.greenhouse.io/coactivesystems",
    "https://jobs.ashbyhq.com/cohere",
    "https://jobs.ashbyhq.com/Crusoe"
];

