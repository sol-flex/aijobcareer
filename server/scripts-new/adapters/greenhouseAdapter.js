const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Greenhouse API Adapter
 * Official API docs: https://developers.greenhouse.io/job-board.html
 * No authentication required for public job boards
 */

const GREENHOUSE_API_BASE = 'https://boards-api.greenhouse.io/v1/boards';

/**
 * Fetch all jobs from a Greenhouse board
 * @param {string} companySlug - Company identifier (e.g., 'anthropic')
 * @returns {Promise<Object>} - Categorized job links
 */
async function fetchJobs(companySlug) {
    try {
        console.log(`Fetching jobs from Greenhouse API for: ${companySlug}`);

        const url = `${GREENHOUSE_API_BASE}/${companySlug}/jobs`;
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json'
            }
        });

        const jobs = response.data.jobs;
        console.log(`Found ${jobs.length} jobs on Greenhouse`);

        // Group jobs by department (category)
        const categorizedJobs = {};

        for (const job of jobs) {
            // Get the primary department name
            const category = job.departments?.[0]?.name || 'General';

            if (!categorizedJobs[category]) {
                categorizedJobs[category] = [];
            }

            categorizedJobs[category].push({
                url: job.absolute_url,
                id: job.id,
                title: job.title,
                location: job.location?.name,
                updatedAt: job.updated_at
            });
        }

        return {
            companyName: jobs[0]?.company_name || companySlug,
            jobLinks: categorizedJobs,
            totalJobs: jobs.length,
            source: 'greenhouse-api'
        };

    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error(`Company "${companySlug}" not found on Greenhouse`);
        }
        throw new Error(`Greenhouse API error: ${error.message}`);
    }
}

/**
 * Fetch detailed job information
 * @param {string} companySlug - Company identifier
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} - Detailed job data
 */
async function fetchJobDetails(companySlug, jobId) {
    try {
        const url = `${GREENHOUSE_API_BASE}/${companySlug}/jobs/${jobId}`;
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json'
            }
        });

        const job = response.data;

        // Use raw HTML content as-is (will be rendered directly on frontend)
        // Decode HTML entities (e.g., &lt; to <, &quot; to ")
        const description = (job.content || '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');

        // Extract salary from content if available
        let salaryMin = null;
        let salaryMax = null;

        // Look for salary patterns in the HTML
        const salaryMatch = job.content?.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
        if (salaryMatch) {
            salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''));
            salaryMax = parseInt(salaryMatch[2].replace(/,/g, ''));
        }

        // Extract plain text for keyword extraction
        const $ = cheerio.load(job.content || '');
        const plainText = $.text();

        return {
            company: job.company_name,
            companyLogo: null, // Will be filled from Company model
            title: job.title,
            primaryRole: job.departments?.[0]?.name || 'General',
            positionType: 'Full-Time', // Greenhouse doesn't always specify
            locationType: job.metadata?.find(m => m.name === 'Location Type')?.value || 'On Site',
            country: extractCountry(job.location?.name),
            locations: job.location?.name || 'Remote',
            description: description, // Raw HTML - ready to render
            keywords: extractKeywords(plainText),
            currency: 'USD',
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            equityMin: null,
            equityMax: null,
            cryptoPayment: false,
            applicationMethod: 'Apply by website',
            applicationUrl: job.absolute_url,
            publishedAt: new Date(job.first_published),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentStatus: 'paid',
            published: true
        };

    } catch (error) {
        throw new Error(`Failed to fetch job details: ${error.message}`);
    }
}

/**
 * Extract country from location string
 */
function extractCountry(locationString) {
    if (!locationString) return 'USA';

    // Common patterns: "City, State", "City, Country", "Remote"
    const parts = locationString.split(',').map(s => s.trim());

    if (parts.length === 1) {
        return locationString.toLowerCase().includes('remote') ? 'Remote' : 'USA';
    }

    // Return last part (usually country or state)
    const lastPart = parts[parts.length - 1];

    // Map common abbreviations
    const countryMap = {
        'US': 'USA',
        'UK': 'United Kingdom',
        'CA': 'Canada',
        'IE': 'Ireland',
        'DE': 'Germany',
        'FR': 'France'
    };

    return countryMap[lastPart] || lastPart;
}

/**
 * Extract keywords from description
 */
function extractKeywords(description) {
    const commonTechKeywords = [
        'React', 'Python', 'JavaScript', 'TypeScript', 'Node.js',
        'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'AI',
        'TensorFlow', 'PyTorch', 'SQL', 'MongoDB', 'PostgreSQL',
        'Git', 'CI/CD', 'API', 'REST', 'GraphQL'
    ];

    const found = commonTechKeywords.filter(keyword =>
        description.includes(keyword)
    );

    return found.join(', ');
}

module.exports = {
    fetchJobs,
    fetchJobDetails
};
