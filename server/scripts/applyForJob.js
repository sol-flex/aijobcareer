const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const Job = require('../models/Job');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const puppeteer = require('puppeteer');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function readAndLogHTML(url) {
    try {
        console.log(`\nReading HTML from: ${url}`);
        console.log('------------------------');

        // Launch Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Navigate to the page
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Wait for 2 seconds to ensure all content is loaded
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

        // Get the page content
        const html = await page.content();
        
        // Log the HTML
        console.log('\nPage HTML:');
        console.log(html);



        const prompt = `

        You will be given html, I want you to provide me with instructions on how i can apply
        to the job posting in an automated way that you see in this html:

        ${html}

        Please also explain to me how you know which url you're supposed to use to apply.

        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "Please provide me with instructions on how I could apply to this job posting in an automated way in javascript."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        console.log(completion.choices[0].message.content)


        // Close browser
        await browser.close();
        
        console.log('------------------------\n');
    } catch (error) {
        console.error('Error reading HTML:', error.message);
    }
}
readAndLogHTML("https://jobs.ashbyhq.com/replit/5b75e059-92c2-43c5-ac97-7fe9186d0c10/application")
