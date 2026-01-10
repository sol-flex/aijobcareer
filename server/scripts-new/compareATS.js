/**
 * Compare HTML output from different ATS platforms
 */

const fs = require('fs');
const greenhouseAdapter = require('./adapters/greenhouseAdapter');
const ashbyAdapter = require('./adapters/ashbyAdapter');

async function compareATS() {
    try {
        console.log('='.repeat(80));
        console.log('COMPARING ATS PLATFORMS');
        console.log('='.repeat(80));

        // 1. Fetch Glean (Greenhouse)
        console.log('\n[1/3] Fetching Glean job (Greenhouse)...');
        const gleanJobs = await greenhouseAdapter.fetchJobs('gleanwork');
        const gleanJobSummary = Object.values(gleanJobs.jobLinks).flat()[0];
        const gleanJob = await greenhouseAdapter.fetchJobDetails('gleanwork', gleanJobSummary.id);

        console.log(`✓ Fetched: ${gleanJob.title}`);
        console.log(`  Company: ${gleanJob.company}`);
        console.log(`  Description length: ${gleanJob.description.length} chars`);

        // 2. Fetch LangChain (Ashby)
        console.log('\n[2/3] Fetching LangChain job (Ashby)...');
        const langchainJobs = await ashbyAdapter.fetchJobs('langchain');
        const langchainJobSummary = Object.values(langchainJobs.jobLinks).flat()[0];
        const langchainJob = await ashbyAdapter.fetchJobDetails('langchain', langchainJobSummary.id);

        console.log(`✓ Fetched: ${langchainJob.title}`);
        console.log(`  Company: ${langchainJob.company}`);
        console.log(`  Description length: ${langchainJob.description.length} chars`);

        // 3. Save both to files
        console.log('\n[3/3] Saving comparison files...');

        // Save full job objects
        fs.writeFileSync(
            'comparison-glean-greenhouse.json',
            JSON.stringify(gleanJob, null, 2)
        );
        console.log('✓ Saved: comparison-glean-greenhouse.json');

        fs.writeFileSync(
            'comparison-langchain-ashby.json',
            JSON.stringify(langchainJob, null, 2)
        );
        console.log('✓ Saved: comparison-langchain-ashby.json');

        // Save just the HTML descriptions for easy comparison
        fs.writeFileSync(
            'comparison-glean-greenhouse.html',
            `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Glean (Greenhouse) HTML</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: #4CAF50;
            color: white;
            padding: 20px;
            margin: -30px -30px 20px -30px;
            border-radius: 8px 8px 0 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Glean (Greenhouse Platform)</h1>
            <p>Job: ${gleanJob.title}</p>
        </div>
        ${gleanJob.description}
    </div>
</body>
</html>`
        );
        console.log('✓ Saved: comparison-glean-greenhouse.html');

        fs.writeFileSync(
            'comparison-langchain-ashby.html',
            `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>LangChain (Ashby) HTML</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: #2196F3;
            color: white;
            padding: 20px;
            margin: -30px -30px 20px -30px;
            border-radius: 8px 8px 0 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LangChain (Ashby Platform)</h1>
            <p>Job: ${langchainJob.title}</p>
        </div>
        ${langchainJob.description}
    </div>
</body>
</html>`
        );
        console.log('✓ Saved: comparison-langchain-ashby.html');

        // Analysis
        console.log('\n' + '='.repeat(80));
        console.log('ANALYSIS');
        console.log('='.repeat(80));

        // Check for inline styles
        const gleanHasStyles = gleanJob.description.includes('style=');
        const langchainHasStyles = langchainJob.description.includes('style=');

        console.log('\nInline Styles:');
        console.log(`  Glean (Greenhouse): ${gleanHasStyles ? 'YES ⚠️' : 'NO ✓'}`);
        console.log(`  LangChain (Ashby):  ${langchainHasStyles ? 'YES ⚠️' : 'NO ✓'}`);

        // Check for classes
        const gleanHasClasses = gleanJob.description.includes('class=');
        const langchainHasClasses = langchainJob.description.includes('class=');

        console.log('\nCSS Classes:');
        console.log(`  Glean (Greenhouse): ${gleanHasClasses ? 'YES' : 'NO'}`);
        console.log(`  LangChain (Ashby):  ${langchainHasClasses ? 'YES' : 'NO'}`);

        // Check structure tags
        const gleanTags = {
            h1: gleanJob.description.includes('<h1'),
            h2: gleanJob.description.includes('<h2'),
            h3: gleanJob.description.includes('<h3'),
            h4: gleanJob.description.includes('<h4'),
            ul: gleanJob.description.includes('<ul'),
            ol: gleanJob.description.includes('<ol'),
            div: gleanJob.description.includes('<div'),
        };

        const langchainTags = {
            h1: langchainJob.description.includes('<h1'),
            h2: langchainJob.description.includes('<h2'),
            h3: langchainJob.description.includes('<h3'),
            h4: langchainJob.description.includes('<h4'),
            ul: langchainJob.description.includes('<ul'),
            ol: langchainJob.description.includes('<ol'),
            div: langchainJob.description.includes('<div'),
        };

        console.log('\nHTML Tags Used:');
        console.log('  Glean (Greenhouse):', Object.entries(gleanTags).filter(([k,v]) => v).map(([k]) => k).join(', '));
        console.log('  LangChain (Ashby): ', Object.entries(langchainTags).filter(([k,v]) => v).map(([k]) => k).join(', '));

        console.log('\n' + '='.repeat(80));
        console.log('FILES CREATED:');
        console.log('='.repeat(80));
        console.log('1. comparison-glean-greenhouse.json     - Full job object');
        console.log('2. comparison-langchain-ashby.json      - Full job object');
        console.log('3. comparison-glean-greenhouse.html     - Preview in browser');
        console.log('4. comparison-langchain-ashby.html      - Preview in browser');
        console.log('\nOpen the .html files in your browser to see visual differences!');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\nError:', error.message);
        console.error(error.stack);
    }
}

compareATS();
