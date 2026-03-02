// diagnostic-test.js
// Run with: node diagnostic-test.js
const domains = ['test-alpha-123.com', 'test-beta-456.com', 'test-gamma-789.com'];

async function runTest() {
    console.log('Starting diagnostic test for /api/search-domains...');
    for (const domain of domains) {
        console.log(`Checking ${domain}...`);
        try {
            const start = Date.now();
            const res = await fetch(`http://localhost:3000/api/search-domains?domain=${domain}`);
            const duration = Date.now() - start;
            console.log(`Status: ${res.status} (${duration}ms)`);
            const data = await res.json();
            console.log('Response:', JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('Fetch failed:', err.message);
        }
    }
}

runTest();
