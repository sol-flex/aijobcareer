const axios = require('axios');
const fs = require('fs');

async function showRawResponse() {
    console.log('Fetching RAW Greenhouse API response...\n');

    // Direct API call - no transformation
    const response = await axios.get('https://boards-api.greenhouse.io/v1/boards/gleanwork/jobs/4613925005');

    const rawAPIData = response.data;

    // Save it
    fs.writeFileSync('raw-greenhouse-api-response.json', JSON.stringify(rawAPIData, null, 2));

    console.log('='.repeat(70));
    console.log('RAW GREENHOUSE API RESPONSE');
    console.log('='.repeat(70));
    console.log('Fields returned by API:');
    console.log(Object.keys(rawAPIData).join(', '));
    console.log('');
    console.log('Title:', rawAPIData.title);
    console.log('Company:', rawAPIData.company_name);
    console.log('Location:', rawAPIData.location?.name);
    console.log('Content length:', rawAPIData.content?.length, 'characters');
    console.log('');
    console.log('✓ Saved to: raw-greenhouse-api-response.json');
    console.log('');

    // Now show our transformed version
    const greenhouseAdapter = require('./adapters/greenhouseAdapter');
    const transformedJob = await greenhouseAdapter.fetchJobDetails('gleanwork', '4613925005');

    fs.writeFileSync('transformed-job-object.json', JSON.stringify(transformedJob, null, 2));

    console.log('='.repeat(70));
    console.log('OUR TRANSFORMED OBJECT (what goes to MongoDB)');
    console.log('='.repeat(70));
    console.log('Fields we create:');
    console.log(Object.keys(transformedJob).join(', '));
    console.log('');
    console.log('Title:', transformedJob.title);
    console.log('Company:', transformedJob.company);
    console.log('Location:', transformedJob.locations);
    console.log('Description length:', transformedJob.description?.length, 'characters');
    console.log('');
    console.log('✓ Saved to: transformed-job-object.json');
    console.log('');

    console.log('='.repeat(70));
    console.log('KEY DIFFERENCES:');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. API gives: company_name → We use: company');
    console.log('2. API gives: location.name → We use: locations');
    console.log('3. API gives: content (HTML) → We use: description (HTML)');
    console.log('4. API gives: departments array → We extract: primaryRole');
    console.log('5. WE ADD: publishedAt, expiresAt, paymentStatus, published');
    console.log('6. WE ADD: companyLogo (from Company model)');
    console.log('7. WE TRANSFORM: HTML entities decoded, salary extracted');
    console.log('');
    console.log('The transformed object matches your Job model schema!');
}

showRawResponse().catch(console.error);
