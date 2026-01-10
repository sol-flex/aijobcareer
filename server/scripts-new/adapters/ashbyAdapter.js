const axios = require('axios');

/**
 * Ashby API Adapter
 * Ashby uses a GraphQL API for job boards
 * API: https://jobs.ashbyhq.com/api/non-user-graphql
 */

/**
 * Extract company identifier from Ashby URL
 * Examples:
 * - https://jobs.ashbyhq.com/llamaindex → llamaindex
 * - https://jobs.ashbyhq.com/cohere/ → cohere
 */
function extractAshbyIdentifier(url) {
    const match = url.match(/ashbyhq\.com\/([^\/\?]+)/);
    return match ? match[1] : null;
}

/**
 * Fetch all jobs from Ashby GraphQL API
 * Returns simple list for URL comparison
 */
async function fetchAshbyJobs(identifier) {
    try {
        const response = await axios.post(
            'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams',
            {
                operationName: 'ApiJobBoardWithTeams',
                variables: {
                    organizationHostedJobsPageName: identifier
                },
                query: `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
                    jobBoard: jobBoardWithTeams(
                        organizationHostedJobsPageName: $organizationHostedJobsPageName
                    ) {
                        jobPostings {
                            id
                            title
                        }
                    }
                }`
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );

        if (!response.data?.data?.jobBoard?.jobPostings) {
            console.error('    ✗ Unexpected Ashby API response structure');
            return null;
        }

        const jobPostings = response.data.data.jobBoard.jobPostings;

        return jobPostings.map(job => ({
            id: job.id,
            url: `https://jobs.ashbyhq.com/${identifier}/${job.id}`,
            title: job.title,
            location: 'To be fetched' // Will be fetched in detail query
        }));

    } catch (error) {
        console.error(`    ✗ Failed to fetch Ashby jobs: ${error.message}`);
        return null;
    }
}

/**
 * Fetch full job details from Ashby by scraping HTML
 * Returns raw HTML - OpenAI will handle formatting
 */
async function fetchAshbyJobDetails(identifier, jobId) {
    try {
        const url = `https://jobs.ashbyhq.com/${identifier}/${jobId}`;
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // Return the full HTML page - OpenAI will parse it
        return {
            html: response.data,
            url: url,
            title: `Job at ${identifier}`, // Will be extracted by OpenAI
            externalLink: url
        };

    } catch (error) {
        console.error(`    ✗ Failed to fetch Ashby job page: ${error.message}`);
        return null;
    }
}

module.exports = {
    extractAshbyIdentifier,
    fetchAshbyJobs,
    fetchAshbyJobDetails
};
