/**
 * Test Lever and Ashby adapters
 * Quick test to verify the APIs work
 */

const { extractLeverIdentifier, fetchLeverJobs, fetchLeverJobDetails } = require('./adapters/leverAdapter');
const { extractAshbyIdentifier, fetchAshbyJobs, fetchAshbyJobDetails } = require('./adapters/ashbyAdapter');

async function testAdapters() {
    console.log('='.repeat(70));
    console.log('TEST LEVER & ASHBY ADAPTERS');
    console.log('='.repeat(70));

    // Test Lever - Mistral AI
    console.log('\n[LEVER TEST] Mistral AI');
    console.log('-'.repeat(70));
    try {
        const leverUrl = 'https://jobs.lever.co/mistral';
        const leverIdentifier = extractLeverIdentifier(leverUrl);
        console.log(`Identifier: ${leverIdentifier}`);

        const leverJobs = await fetchLeverJobs(leverIdentifier);
        if (leverJobs) {
            console.log(`✓ Found ${leverJobs.length} jobs`);
            if (leverJobs.length > 0) {
                console.log(`\nFirst job:`);
                console.log(`  Title: ${leverJobs[0].title}`);
                console.log(`  Location: ${leverJobs[0].location}`);
                console.log(`  URL: ${leverJobs[0].url}`);

                // Fetch full details
                console.log(`\nFetching full details for first job...`);
                const details = await fetchLeverJobDetails(leverIdentifier, leverJobs[0].id);
                if (details) {
                    console.log(`✓ Got full details`);
                    console.log(`  Keys: ${Object.keys(details).join(', ')}`);
                }
            }
        }
    } catch (error) {
        console.error(`✗ Lever test failed: ${error.message}`);
    }

    // Test Ashby - LlamaIndex
    console.log('\n\n[ASHBY TEST] LlamaIndex');
    console.log('-'.repeat(70));
    try {
        const ashbyUrl = 'https://jobs.ashbyhq.com/llamaindex';
        const ashbyIdentifier = extractAshbyIdentifier(ashbyUrl);
        console.log(`Identifier: ${ashbyIdentifier}`);

        const ashbyJobs = await fetchAshbyJobs(ashbyIdentifier);
        if (ashbyJobs) {
            console.log(`✓ Found ${ashbyJobs.length} jobs`);
            if (ashbyJobs.length > 0) {
                console.log(`\nFirst job:`);
                console.log(`  Title: ${ashbyJobs[0].title}`);
                console.log(`  Location: ${ashbyJobs[0].location}`);
                console.log(`  Department: ${ashbyJobs[0].department}`);
                console.log(`  URL: ${ashbyJobs[0].url}`);

                // Fetch full details
                console.log(`\nFetching full details for first job...`);
                const details = await fetchAshbyJobDetails(ashbyIdentifier, ashbyJobs[0].id);
                if (details) {
                    console.log(`✓ Got full details`);
                    console.log(`  Keys: ${Object.keys(details).join(', ')}`);
                }
            }
        }
    } catch (error) {
        console.error(`✗ Ashby test failed: ${error.message}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('TEST COMPLETE');
    console.log('='.repeat(70));
}

testAdapters();
