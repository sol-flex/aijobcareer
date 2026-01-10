/**
 * HTML Normalization Utility
 * Strips vendor-specific styles and classes for consistent rendering
 */

const cheerio = require('cheerio');

/**
 * Normalize HTML from different ATS platforms
 * - Removes inline styles
 * - Removes vendor-specific classes
 * - Keeps semantic HTML structure
 * - Ensures consistent output
 */
function normalizeJobHTML(html) {
    if (!html) return '';

    // Decode HTML entities first
    html = html
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');

    // Load with cheerio
    const $ = cheerio.load(html, {
        decodeEntities: true,
        normalizeWhitespace: true
    });

    // Remove script and style tags entirely
    $('script, style').remove();

    // Strip all inline styles
    $('[style]').removeAttr('style');

    // Strip all classes (vendor-specific)
    $('[class]').removeAttr('class');

    // Normalize heading tags (convert h1-h6 to h2 for consistency)
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
        const $el = $(el);
        const content = $el.html();
        $el.replaceWith(`<h2>${content}</h2>`);
    });

    // Clean up spans that are just wrappers (no attributes)
    $('span').each((i, el) => {
        const $el = $(el);
        // If span has no attributes, unwrap it
        if (Object.keys(el.attribs).length === 0) {
            $el.replaceWith($el.html());
        }
    });

    // Get the cleaned HTML
    let cleanHtml = $('body').html() || '';

    // Additional cleanup with regex
    cleanHtml = cleanHtml
        // Remove empty tags
        .replace(/<(\w+)>\s*<\/\1>/g, '')
        // Remove multiple consecutive line breaks
        .replace(/(\n\s*){3,}/g, '\n\n')
        // Clean up whitespace
        .trim();

    return cleanHtml;
}

/**
 * Convert HTML to plain text (for keyword extraction)
 */
function htmlToPlainText(html) {
    if (!html) return '';

    const $ = cheerio.load(html);
    return $.text().trim();
}

module.exports = {
    normalizeJobHTML,
    htmlToPlainText
};
