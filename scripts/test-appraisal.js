// Native fetch is available in Node.js 18+

async function testAppraisals() {
    const url = 'http://localhost:3000/api/appraise';
    const body = {
        domains: ['example.com', 'test.ai', 'google.com']
    };

    try {
        console.log(`Testing POST ${url}...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testAppraisals();
