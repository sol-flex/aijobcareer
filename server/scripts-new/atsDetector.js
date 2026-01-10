const axios = require('axios');

/**
 * Detects which ATS (Applicant Tracking System) a company uses
 * based on their career page URL
 */

const ATS_PATTERNS = {
    greenhouse: [
        /greenhouse\.io/i,
        /boards\.greenhouse\.io/i,
        /job-boards\.greenhouse\.io/i
    ],
    lever: [
        /lever\.co/i,
        /jobs\.lever\.co/i
    ],
    ashby: [
        /jobs\.ashbyhq\.com/i,
        /ashbyhq\.com/i
    ],
    workable: [
        /apply\.workable\.com/i,
        /workable\.com/i
    ]
};

/**
 * Detect ATS from URL pattern
 * @param {string} url - Career page URL
 * @returns {string|null} - ATS name or null
 */
function detectATSFromURL(url) {
    for (const [ats, patterns] of Object.entries(ATS_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(url)) {
                return ats;
            }
        }
    }
    return null;
}

/**
 * Extract company slug from ATS URL
 * @param {string} url - Career page URL
 * @param {string} ats - ATS type
 * @returns {string|null} - Company slug
 */
function extractCompanySlug(url, ats) {
    try {
        const urlObj = new URL(url);

        switch (ats) {
            case 'greenhouse':
                // greenhouse.io/company or job-boards.greenhouse.io/company
                const ghPath = urlObj.pathname.split('/').filter(Boolean);
                return ghPath[0] || null;

            case 'lever':
                // jobs.lever.co/company
                const leverPath = urlObj.pathname.split('/').filter(Boolean);
                return leverPath[0] || null;

            case 'ashby':
                // jobs.ashbyhq.com/company
                const ashbyPath = urlObj.pathname.split('/').filter(Boolean);
                return ashbyPath[0] || null;

            default:
                return null;
        }
    } catch (error) {
        console.error('Error extracting company slug:', error.message);
        return null;
    }
}

/**
 * Check if RSS feed exists for a URL
 * @param {string} url - Base URL to check
 * @returns {Promise<string|null>} - RSS URL if exists
 */
async function detectRSSFeed(url) {
    const possibleFeeds = [
        `${url}/feed`,
        `${url}.rss`,
        `${url}/rss`,
        `${url}/careers.rss`
    ];

    for (const feedUrl of possibleFeeds) {
        try {
            const response = await axios.head(feedUrl, { timeout: 3000 });
            if (response.status === 200) {
                return feedUrl;
            }
        } catch (error) {
            // Continue checking other URLs
        }
    }

    return null;
}

/**
 * Main detection function
 * @param {string} url - Career page URL
 * @returns {Promise<Object>} - Detection result
 */
async function detectATSPlatform(url) {
    const ats = detectATSFromURL(url);

    if (ats) {
        const slug = extractCompanySlug(url, ats);
        return {
            platform: ats,
            slug: slug,
            url: url,
            method: 'api'
        };
    }

    // Check for RSS feed
    const rssFeed = await detectRSSFeed(url);
    if (rssFeed) {
        return {
            platform: 'rss',
            url: rssFeed,
            method: 'rss'
        };
    }

    // Fallback to scraping
    return {
        platform: 'unknown',
        url: url,
        method: 'scrape'
    };
}

module.exports = {
    detectATSPlatform,
    detectATSFromURL,
    extractCompanySlug,
    detectRSSFeed
};
