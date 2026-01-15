const axios = require('axios');

/**
 * Lever API Adapter
 * Official API docs: https://github.com/lever/postings-api
 * No authentication required for public job postings
 */

const LEVER_API_BASE = 'https://api.lever.co/v0/postings';

/**
 * Extract company identifier from Lever URL
 * Examples:
 * - https://jobs.lever.co/mistral → mistral
 * - https://jobs.lever.co/stackblitz → stackblitz
 */
function extractLeverIdentifier(url) {
    const match = url.match(/lever\.co\/([^\/\?]+)/);
    return match ? match[1] : null;
}

/**
 * Fetch all jobs from Lever API
 * Returns simple list for URL comparison
 */
async function fetchLeverJobs(identifier) {
    try {
        const url = `${LEVER_API_BASE}/${identifier}`;
        const response = await axios.get(url, {
            params: { mode: 'json' },
            timeout: 10000,
            headers: { 'Accept': 'application/json' }
        });

        const jobs = response.data;

        return jobs.map(job => ({
            id: job.id,
            url: job.hostedUrl,
            title: job.text,
            location: job.categories?.location || job.workplaceType || 'Not specified',
            fullData: job // Cache for later use
        }));

    } catch (error) {
        console.error(`    ✗ Failed to fetch Lever jobs: ${error.message}`);
        return null;
    }
}

/**
 * Combine all Lever text content into a single string
 * This ensures OpenAI sees all job details consistently
 */
function combineLeverContent(leverData) {
    let fullContent = '';

    // 1. Main description
    if (leverData.descriptionPlain) {
        fullContent += leverData.descriptionPlain + '\n\n';
    }

    // 2. Lists (What You'll Do, Requirements, etc.)
    if (leverData.lists && leverData.lists.length > 0) {
        leverData.lists.forEach(list => {
            if (list.text) fullContent += '## ' + list.text + '\n';
            if (list.content) {
                // Strip HTML tags but preserve structure
                const plainContent = list.content
                    .replace(/<li>/g, '- ')
                    .replace(/<\/li>/g, '\n')
                    .replace(/<[^>]+>/g, '');
                fullContent += plainContent + '\n\n';
            }
        });
    }

    // 3. Additional info (benefits, culture, etc.)
    if (leverData.additionalPlain) {
        fullContent += leverData.additionalPlain + '\n\n';
    }

    return fullContent.trim();
}

/**
 * Fetch full job details from Lever API
 * Returns raw API data with combined content for OpenAI parsing
 */
async function fetchLeverJobDetails(identifier, jobId) {
    try {
        const url = `${LEVER_API_BASE}/${identifier}/${jobId}`;
        const response = await axios.get(url, {
            params: { mode: 'json' },
            timeout: 10000
        });

        const data = response.data;

        // Add combined content field for reliable OpenAI parsing
        data.combinedContent = combineLeverContent(data);

        return data;

    } catch (error) {
        console.error(`    ✗ Failed to fetch Lever job details: ${error.message}`);
        return null;
    }
}

module.exports = {
    extractLeverIdentifier,
    fetchLeverJobs,
    fetchLeverJobDetails
};
