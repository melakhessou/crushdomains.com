// Native fetch is available in Node.js 18+

async function testAppraisals() {
    const url = 'http://localhost:3000/api/appraise';
    // Test various complex cases
    const domains = [
        'example.com',
        'my-startup-idea.io',
        '123456.xyz',
        'verylongdomainnamecontainingmanywords.net',
        'google.com'
    ];

    const body = { domains };

    try {
        console.log(`Testing POST ${url} with ${domains.length} domains...`);
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

        data.appraisals.forEach(app => {
            console.log(`Domain: ${app.domain}, Status: ${app.status}, Error: ${app.error || 'None'}`);
            if (app.status === 'fallback_required') {
                console.log('FULL RECORD:', JSON.stringify(app, null, 2));
            }
        });

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testAppraisals();
