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
 * Fetch full job details from Lever API
 * Returns raw API data for OpenAI parsing
 */
async function fetchLeverJobDetails(identifier, jobId) {
    try {
        const url = `${LEVER_API_BASE}/${identifier}/${jobId}`;
        const response = await axios.get(url, {
            params: { mode: 'json' },
            timeout: 10000
        });

        return response.data;

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
