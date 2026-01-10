const axios = require('axios');

async function debugAshby() {
    try {
        const response = await axios.post(
            'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams',
            {
                operationName: 'ApiJobBoardWithTeams',
                variables: {
                    organizationHostedJobsPageName: 'llamaindex'
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

        console.log('Response status:', response.status);
        console.log('Job listings:', JSON.stringify(response.data, null, 2));

        // Now test fetching details for the first job
        if (response.data.data.jobBoard.jobPostings.length > 0) {
            const firstJobId = response.data.data.jobBoard.jobPostings[0].id;
            console.log(`\n\nFetching details for job: ${firstJobId}`);

            const detailResponse = await axios.post(
                'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobPosting',
                {
                    operationName: 'ApiJobPosting',
                    variables: {
                        organizationHostedJobsPageName: 'llamaindex',
                        jobPostingId: firstJobId
                    },
                    query: `query ApiJobPosting($organizationHostedJobsPageName: String!, $jobPostingId: String!) {
                        jobPosting: jobPosting(
                            organizationHostedJobsPageName: $organizationHostedJobsPageName
                            jobPostingId: $jobPostingId
                        ) {
                            id
                            title
                            info
                        }
                    }`
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                }
            );

            console.log('Detail response:', JSON.stringify(detailResponse.data, null, 2));
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

debugAshby();
