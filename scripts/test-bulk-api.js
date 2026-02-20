
const axios = require('axios');

async function testBulkAppraisal() {
    const domains = [
        'example.com',
        'google.com',
        'test.io',
        'ai.com',
        'crypto.net'
    ];

    try {
        console.log('Testing Bulk Appraisal API...');
        console.time('Appraisal Time');

        const response = await axios.post('http://localhost:3000/api/bulk-appraisal', {
            domains
        });

        console.timeEnd('Appraisal Time');
        console.log('Status:', response.status);
        console.log('Results:', JSON.stringify(response.data, null, 2));

        if (response.data.results && response.data.results.length === 5) {
            console.log('SUCCESS: Received 5 results.');
        } else {
            console.error('FAILURE: Expected 5 results, got', response.data.results?.length);
        }

    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
    }
}

testBulkAppraisal();
