const fs = require('fs');
const greenhouseAdapter = require('./adapters/greenhouseAdapter');

async function save() {
    const gleanJobs = await greenhouseAdapter.fetchJobs('gleanwork');
    const firstJob = Object.values(gleanJobs.jobLinks).flat()[0];
    const gleanJob = await greenhouseAdapter.fetchJobDetails('gleanwork', firstJob.id);

    // Save full object
    fs.writeFileSync('glean-job-object.json', JSON.stringify(gleanJob, null, 2));
    console.log('✓ Saved: glean-job-object.json');

    // Save HTML for visual inspection
    fs.writeFileSync('glean-job-html.html', `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${gleanJob.title}</title>
<style>
body { font-family: Arial; max-width: 800px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
.container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.header { background: #4CAF50; color: white; padding: 20px; margin: -30px -30px 20px; border-radius: 8px 8px 0 0; }
h2 { color: #333; margin-top: 30px; }
</style></head><body>
<div class="container">
<div class="header"><h1>Glean - Greenhouse Platform</h1><p>${gleanJob.title}</p></div>
<h2>Raw HTML from API:</h2>
${gleanJob.description}
</div></body></html>`);
    console.log('✓ Saved: glean-job-html.html');
    console.log('\nOpen glean-job-html.html in your browser to see how it renders!');
}

save().catch(console.error);
