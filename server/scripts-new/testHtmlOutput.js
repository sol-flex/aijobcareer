/**
 * Test to show the HTML description output
 */

const greenhouseAdapter = require('./adapters/greenhouseAdapter');

async function testHtmlOutput() {
    try {
        console.log('Fetching job details for Glean AI Outcomes Manager...\n');

        const jobDetails = await greenhouseAdapter.fetchJobDetails('gleanwork', '4613925005');

        console.log('='.repeat(80));
        console.log('JOB DETAILS WITH HTML DESCRIPTION');
        console.log('='.repeat(80));

        console.log('\nMetadata:');
        console.log(`  Title: ${jobDetails.title}`);
        console.log(`  Company: ${jobDetails.company}`);
        console.log(`  Location: ${jobDetails.locations} (${jobDetails.locationType})`);
        console.log(`  Primary Role: ${jobDetails.primaryRole}`);
        console.log(`  Keywords: ${jobDetails.keywords}`);

        console.log('\n' + '='.repeat(80));
        console.log('DESCRIPTION (First 1500 characters of HTML):');
        console.log('='.repeat(80));
        console.log(jobDetails.description.substring(0, 1500));
        console.log('\n...[truncated]...');

        console.log('\n' + '='.repeat(80));
        console.log('DESCRIPTION LENGTH:');
        console.log('='.repeat(80));
        console.log(`Total characters: ${jobDetails.description.length}`);
        console.log(`Contains HTML tags: ${jobDetails.description.includes('<div>') ? 'YES ✓' : 'NO'}`);
        console.log(`Contains inline styles: ${jobDetails.description.includes('style=') ? 'YES ✓' : 'NO'}`);

        console.log('\n' + '='.repeat(80));
        console.log('HOW TO RENDER IN REACT:');
        console.log('='.repeat(80));
        console.log(`
// Option 1: Using dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: job.description }} />

// Option 2: Using html-react-parser (recommended)
import parse from 'html-react-parser';
<div className="job-description">
  {parse(job.description)}
</div>
        `);

        console.log('\n✓ Test complete!');
        console.log('\nNOTE: This HTML is ready to render directly on your frontend.');
        console.log('No markdown conversion needed, no OpenAI needed, $0 cost!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testHtmlOutput();
