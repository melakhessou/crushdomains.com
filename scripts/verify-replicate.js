const axios = require('axios');

async function testReplicateIntegration() {
    const baseUrl = 'http://localhost:3000/api/appraise';
    const domain = 'startup.io';

    // Testing the dynamic route: /api/appraise/[domain]
    const url = `${baseUrl}/${domain}`;

    try {
        console.log(`Testing Appraisal API (Replicate) for ${domain}...`);
        console.log(`URL: ${url}`);

        const response = await axios.get(url);

        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Domain:', response.data.domain);
        console.log('Estimated Value:', response.data.mid);
        console.log('Currency:', response.data.currency);
        console.log('Confidence:', response.data.confidence);
        console.log('Domain Score:', response.data.domainScore);

        if (response.data.success && response.data.mid > 0 && response.data.domainScore !== undefined) {
            console.log('✅ API Integration Verified Successfully');
        } else {
            console.log('❌ API Response Invalid or Incomplete');
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Is the Next.js server running on port 3000?');
        }
    }
}

testReplicateIntegration();
