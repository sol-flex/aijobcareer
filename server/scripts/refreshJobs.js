const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const path = require('path');
const { OpenAI } = require('openai');
const puppeteer = require('puppeteer');
const { parseJobWithAI } = require('./jobScraper');
const { getJobLinksWithAI, getJobLinks } = require('./getJobLinks');
const Job = require('../models/Job');
const Company = require('../models/Company');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


// iterate over entries in the company database
// for each company scrape the website to get the job links
// detect new jobs and jobs which have been taken down
// update databases accordingly 

const findCompanies = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const companies = await Company.find();

    return companies;

    console.log(companies);
}

const getJobLinksInternal = async (url) => {
    //for each job
    // scrape the jobWebsite
    // detect # of jobs and compare to number
    // return newJobs and archivedJobs
    try {

        console.log(`\nScraping job links from: ${url}`);
        console.log('------------------------');

                // Launch Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Add a 5-second delay to ensure all content is fully loaded
        console.log('Waiting for 5 seconds...');
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 5000))); // Wait for 5 seconds

        // Get the page content after JS execution
        const html = await page.content();

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
        3. Include both relative and absolute URLs
        4. Ensure no job links are skipped
        5. If a job appears in multiple categories, include it in all relevant categories
        6. If no clear categories exist, use "All Positions" as the category
        7. Return ONLY the JSON object, no additional text
        
        Expected format:
        {
            "Engineering": [
                "url1",
                "url2"
            ],
            "Marketing": [
                "url3",
                "url4"
            ]
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

        await browser.close();
        return response;

    } catch(error) {
        console.error('Error scraping job links:', error);
        if (browser) {
            await browser.close();
        }
        throw error; // Re-throw the error after cleanup
    }

}
//the purpose of this is to find new jobs and jobs which have been taken down
//and update the database accordingly
const main = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // get companies from database that have job listings
        const companies = await findCompanies();
        console.log(companies);
    
        for (const company of companies) {
                console.log(`Processing ${company.name}`);
                
                // Get all jobs from this company's website
                // the format is { "Category": ["url1", "url2", ...], "Category2": ["url3", "url4", ...], ...}
                const { jobLinks, companyName } = await getJobLinks(company.jobWebsite);

                console.log("Job links:",jobLinks);
                console.log("Company name:",companyName)
                
                // Get existing jobs from database for this company
                const existingJobs = await Job.find({ company: company.name });
                const existingJobUrls = new Set(existingJobs.map(job => job.applicationUrl));
    
                console.log(existingJobUrls);

                for(const [category, urls] of Object.entries(jobLinks)) {
                    for(const url of urls) {
                        const existingJob = existingJobUrls.has(url);

                        console.log(existingJob);
    
                        if(!existingJob) {
                            const jobData = await parseJobWithAI(url, category);
                            console.log("Job data:",jobData);

                            if(jobData) {
                                const job = new Job(jobData);
                                await job.save();
                                console.log(`New job added: ${jobData.title}`);
                            } else {
                                console.log(`Failed to parse job data for: ${url}`);
                            }
                        } else {
                            console.log(`Job already exists: ${url}`);
                        }
                    }
                        
        
                }
        }

        await mongoose.disconnect();
        console.log('MongoDB Disconnected Successfully');

    } catch(err) {
        console.log(err)
    }
}

main();