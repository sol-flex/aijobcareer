const axios = require('axios');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');
const puppeteer = require('puppeteer');
require('dotenv').config();



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

        console.log(cleanHtml)

        const prompt = `
        Analyze this page HTML and return a JSON object where:
        - Keys are the companies found on the page
        - Value is an object with the category of the company
        
        IMPORTANT INSTRUCTIONS:
        1. Identify all companies present on the page
        2. Create an object where the keys are the company name
        3. Include both relative and absolute URLs
        4. Return ONLY the JSON object, no additional text
        
        Expected format:
        {
            "Company 1": {
                "Category": "example: AI cloud provider",
                
            },
        }
        
        HTML Content:
        ${cleanHtml}
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "You are a company name extraction specialist. Return only valid JSON array containing companies."
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
        console.log(`\nScraping companies from: ${url}`);
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

        console.log(html);

        const links = await getJobLinksWithAI(html, url);
        
        console.log('------------------------\n');
        await browser.close();
        return links;

    } catch (error) {
        console.error('Error scraping job links:', error.message);
        return [];
    }
}

// Example usage
const urlsToScrape = [
    'https://www.forbes.com/lists/ai50/',
    // Add more URLs here
];

async function main() {
    for (const url of urlsToScrape) {
        const jobLinks = await getJobLinks(url);
        console.log(`Total companies found on ${url}: ${jobLinks.length}`);
    }
}

// Run the script if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = getJobLinks;