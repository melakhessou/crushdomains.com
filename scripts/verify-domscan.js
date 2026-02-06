const axios = require('axios');

async function testDomScanIntegration() {
    const baseUrl = 'http://localhost:3000/api/appraise';
    const domain = 'startup.io';

    try {
        console.log(`Testing Appraisal API for ${domain}...`);
        const response = await axios.get(`${baseUrl}?domain=${domain}`);

        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Domain:', response.data.domain);
        console.log('Estimated Value:', response.data.mid);
        console.log('Currency:', response.data.currency);
        console.log('Confidence:', response.data.confidence);

        if (response.data.success && response.data.mid > 0) {
            console.log('✅ API Integration Verified Successfully');
        } else {
            console.log('❌ API Response Invalid');
        }

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

testDomScanIntegration();
