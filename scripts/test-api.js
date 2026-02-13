// Use native fetch (Node 18+)

async function testApi() {
    const domains = ['coolshop.com', 'xbzqkrwnpfl.com', 'my-long-test-domain.com', 'rare.ai'];

    console.log('Testing /api/appraise with:', domains);

    try {
        const res = await fetch('http://localhost:3000/api/appraise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains })
        });
        const data = await res.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

testApi();
