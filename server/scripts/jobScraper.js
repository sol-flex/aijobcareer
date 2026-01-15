const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Company = require('../models/Company');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const puppeteer = require('puppeteer');


const { z } = require("zod");
const { zodResponseFormat } = require("openai/helpers/zod")


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const JobPosting = z.object({
    // Company Info
    company: z.string(),
    companyLogo: z.string().optional(),
    
    // Basic Info
    title: z.string(),
    primaryRole: z.string(),
    positionType: z.enum(["Full-Time", "Part-Time", "Contract"]),
    
    // Location
    locationType: z.enum(["Remote", "On Site", "Hybrid"]),
    country: z.string(),
    locations: z.string(),
    
    // Details
    description: z.string(),
    keywords: z.string().optional(),
    
    // Compensation
    currency: z.string(),
    salaryMin: z.number().optional(),
    salaryMax: z.number().optional(),
    equityMin: z.number().optional(),
    equityMax: z.number().optional(),
    cryptoPayment: z.boolean(),
    
    // How to Apply
    applicationMethod: z.enum(["Apply by website", "Apply by email"]),
    applicationUrl: z.string()
});
  

async function parseJobWithAI(url, category, companyName) {
    try {

        // Launch Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Add a 5-second delay to ensure all content is fully loaded
        console.log('Waiting for 2 seconds...');
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000))); // Wait for 5 seconds

        // Get the page content after JS execution
        const html = await page.content();

        const $ = cheerio.load(html);
        
        // Clean the HTML content
        $('script').remove();
        $('style').remove();
        const cleanContent = $('body').text().trim();

        const prompt = `
        Please analyze this job posting content and extract information to fill a job schema. 
        Return ONLY a JSON object with these fields from our mongoose Job model:

        {
            "company": "Company name",
            "companyLogo": "Logo URL (if able to identify from the html)",
            "title": "Job title",
            "primaryRole": "Main role category",
            "positionType": "Full-Time/Part-Time/Contract",
            "locationType": "Remote/On Site/Hybrid",
            "country": "Country of job",
            "locations": "City/Cities",
            "description": "Full job description",
            "keywords": "Relevant skills and technologies, comma separated",
            "currency": "Salary currency (default USD)",
            "salaryMin": "Minimum salary if listed (numeric only)",
            "salaryMax": "Maximum salary if listed (numeric only)",
            "equityMin": "Minimum equity if listed (numeric only)",
            "equityMax": "Maximum equity if listed (numeric only)",
            "cryptoPayment": false,
            "applicationMethod": "Apply by website",
            "applicationUrl": "Application URL"
        }

                
        IMPORTANT:
        - Use the EXACT original job description text for the description field
        - Add appropriate markdown formatting for the description
          * Use ## for main section headers (e.g., "## About Us", "## Responsibilities", "## Requirements")
          * Use bullet points (- or *) for lists
          * Use **bold** for emphasis on important terms
          * Add line breaks between sections for readability
          * Preserve any existing lists or formatting structure
          * Do not summarize or remove any content

        - Do not summarize or modify the description
        - If currency is not specified, use "USD"
        - If cryptoPayment is not specified, use false
        - If applicationMethod is not clear, use "Apply by website"
        - For the "locations" field:
          * If specific city/location is mentioned, use that (e.g., "San Francisco, CA", "New York, NY")
          * If the job is Remote with no specific location, use "Remote"
          * If the job is Remote but country-specific, use format like "Remote - United States"
          * Never use the string "null" for locations
        - If you're unable to identify the company logo image URL, use "null"
        - If you're able to identify the company logo image URL, use it in companyLogo
        - For other fields, if truly unavailable, write the string "null"

        Job posting content to analyze:
        ${cleanContent}
        Company name: 
        ${companyName}
        Application URL:
        ${url}
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "You are a job posting analyzer. Extract job details and return only valid JSON matching the specified schema. Make educated guesses for missing fields based on context. Ensure all required fields have values."
                },
                { role: "user", content: prompt }
            ],
            response_format: zodResponseFormat(JobPosting, "job_response"),
            temperature: 0.7,
        });

        console.log(completion.choices[0].message.content)

        let jobData = JSON.parse(completion.choices[0].message.content)

        jobData.applicationUrl = url;
        jobData.primaryRole = category;
        jobData.publishedAt = new Date();
        jobData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        jobData.paymentStatus = 'paid';
        jobData.published = true
        // Parse and return the AI response
        return jobData;

    } catch (error) {
        console.error('Error parsing job with AI:', error.message);
        return null;
    }
}

async function scrapeJobs(categorizedUrls, companyName) {
    try {

        // Connect to MongoDB once at the start
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const [category, urls] of Object.entries(categorizedUrls)) {
            console.log(`\nProcessing category: ${category}`);
            console.log('------------------------');

            let jobsToAdd = Math.floor(Math.random() * 2) + 1;
            console.log(`Going to add `, jobsToAdd, ` jobs`);
            let jobsAdded = 0;

            for (const url of urls) {
                if (jobsAdded >= jobsToAdd) break;
                console.log(`Checking whether ${url} already exists`)

                // Check if job already exists in database
                const existingJob = await Job.findOne({ applicationUrl: url });
                const company = await Company.findOne({ name: companyName });

                if (existingJob) {
                    if (existingJob.companyLogo == "null" || !existingJob.companyLogo) {
                        existingJob.companyLogo = company.logo
                        await existingJob.save();
                        console.log(`Updated logo for existing job: ${existingJob.title} at ${existingJob.company}`);
                    }
                    console.log(`Job already exists in database, skipping: ${url}`);
                    continue;
                }
                //Add job
                jobsAdded++;

                console.log(`\nJob doesn't exist. Scraping: ${url}`);
                console.log('------------------------');
    
                // Parse job data with AI
                const jobData = await parseJobWithAI(url, category, companyName);
    
                if (jobData) {
                    try {                    
                        // Check if job already exists
                        const existingJob = await Job.findOne({
                            applicationUrl: jobData.applicationUrl
                        });

                        if (!existingJob) {    
                            // Create new job
                            const job = new Job(jobData);

                            // Try to find company and get logo
                            try {
                                if (company && company.logo) {
                                    job.companyLogo = company.logo;
                                }
                            } catch (error) {
                                console.error('Error fetching company logo:', error.message);
                            }

                            await job.save();
                            console.log(`Successfully created job: ${jobData.title} at ${jobData.company}`);
                            
                            // Log the saved job data
                            console.log('\nSaved Job Data:');
                            console.log(JSON.stringify(jobData, null, 2));
                        } else if (existingJob && existingJob.companyLogo == "null") {
                            existingJob.companyLogo = company.logo;
                            await existingJob.save();
                            console.log(`Updated logo for job: ${existingJob.title} at ${existingJob.company}`);
                        } else {
                            console.log(`Job already exists and has logo: ${existingJob.title} at ${existingJob.company}`);
                        }
                    } catch (error) {
                        console.error('Error saving to MongoDB:', error.message);
                    }
                }
    
                // Output the parsed data
                console.log('\nParsed Job Data:');
                console.log(jobData);

                
                // console.log(JSON.stringify(jobData, null, 2));
                console.log('------------------------\n');
            }

        }

    } catch (error) {
        console.error('Error scraping job:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected Successfully');
    }
}

// Example URLs array - add actual job description URLs here
/*
const companyName = 'Pika';
const urlsToScrape = {
    Engineering: [
      'https://job-boards.greenhouse.io/pika/jobs/4671795007',
      'https://job-boards.greenhouse.io/pika/jobs/4600988007',
      'https://job-boards.greenhouse.io/pika/jobs/4608197007',
      'https://job-boards.greenhouse.io/pika/jobs/4700569007',
      'https://job-boards.greenhouse.io/pika/jobs/4164216007',
      'https://job-boards.greenhouse.io/pika/jobs/4166982007',
      'https://job-boards.greenhouse.io/pika/jobs/4668563007',
      'https://job-boards.greenhouse.io/pika/jobs/4653124007',
      'https://job-boards.greenhouse.io/pika/jobs/4649697007'
    ],
    Product: [ 'https://job-boards.greenhouse.io/pika/jobs/4381601007' ]
}
*/

// scrapeJobs(urlsToScrape, companyName);

module.exports = {
    parseJobWithAI,
    scrapeJobs
};
// missing Anysphere, 
// not ashby
