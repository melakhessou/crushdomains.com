
const fetch = require('node-fetch'); // Ensure node-fetch is available or use built-in fetch in Node 18+

async function testApiSpeed() {
    const domain = `speed-test-${Date.now()}.com`;
    console.log(`Testing appraisal speed for ${domain}...`);

    const start = performance.now();

    try {
        const response = await fetch('http://localhost:3000/api/appraise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains: [domain] })
        });

        const data = await response.json();
        const end = performance.now();

        console.log(`Total API Time: ${(end - start).toFixed(2)}ms`);
        console.log('Response Status:', response.status);
        if (data.error) {
            console.error('API Error:', data.error);
        } else {
            console.log('Appraisal Source:', data.appraisals[0].source);
        }

    } catch (err) {
        console.error('Request failed:', err.message);
    }
}

testApiSpeed();
