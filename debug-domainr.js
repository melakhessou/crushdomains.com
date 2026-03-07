const domain = 'google.com';
const FASTLY_KEY = 'WLuolnQjJedOzoADkLD1DDVt7sapIKpz'; // From .env.local

async function check() {
    const url = `https://api.domainr.com/v2/status?domain=${domain}`;
    const headers = { 'Fastly-Key': FASTLY_KEY };

    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

check();
