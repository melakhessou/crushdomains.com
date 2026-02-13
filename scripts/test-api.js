// Use native fetch (Node 18+)
const fetchFn = fetch;

async function testApi() {
    const domains = ['coolshop.com', 'my-long-test-domain.com', 'rare.ai'];


    try {
        console.log('Testing /api/appraise with:', domains);
        const response = await fetchFn('http://localhost:3000/api/appraise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains })
        });

        if (!response.ok) {
            console.error('API Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }

        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testApi();
