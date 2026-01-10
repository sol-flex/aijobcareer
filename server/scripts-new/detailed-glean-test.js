const greenhouseAdapter = require('./adapters/greenhouseAdapter');
const fs = require('fs');

async function detailedGleanTest() {
    const output = [];

    function log(msg) {
        console.log(msg);
        output.push(msg);
    }

    try {
        log('='.repeat(80));
        log('DETAILED GLEAN TEST RESULTS');
        log('Date: ' + new Date().toISOString());
        log('='.repeat(80));

        // Fetch all jobs
        log('\n[1] Fetching all jobs from Greenhouse API...');
        const jobData = await greenhouseAdapter.fetchJobs('gleanwork');

        log(`\n✓ Found ${jobData.totalJobs} total jobs`);
        log(`Company: ${jobData.companyName}`);

        // Show all jobs with details
        log('\n[2] All Jobs List:');
        log('-'.repeat(80));

        const allJobs = Object.values(jobData.jobLinks).flat();

        for (let i = 0; i < Math.min(10, allJobs.length); i++) {
            const job = allJobs[i];
            log(`\n${i + 1}. ${job.title}`);
            log(`   Location: ${job.location}`);
            log(`   URL: ${job.url}`);
            log(`   Updated: ${job.updatedAt}`);
        }

        log(`\n... and ${allJobs.length - 10} more jobs`);

        // Get detailed info for first 3
        log('\n\n[3] Detailed Job Information (First 3):');
        log('='.repeat(80));

        for (let i = 0; i < Math.min(3, allJobs.length); i++) {
            const job = allJobs[i];
            log(`\n--- JOB ${i + 1}: ${job.title} ---`);

            const details = await greenhouseAdapter.fetchJobDetails('gleanwork', job.id);

            log(`\nFull Details:`);
            log(JSON.stringify(details, null, 2));

            log(`\n--- Description Preview ---`);
            log(details.description.substring(0, 1000));
            log('...\n');

            // Small delay
            await new Promise(r => setTimeout(r, 500));
        }

        log('\n' + '='.repeat(80));
        log('TEST COMPLETE');
        log('='.repeat(80));

    } catch (error) {
        log(`\nERROR: ${error.message}`);
        log(error.stack);
    }

    // Save to file
    fs.writeFileSync('glean-detailed-results.txt', output.join('\n'));
    console.log('\n✓ Results saved to: glean-detailed-results.txt');
}

detailedGleanTest();
