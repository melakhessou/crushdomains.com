
import { checkTldRegistrations } from '../src/lib/tld-checker';

const domain = 'example';
// We use a known domain to test speed. 
// Note: This script needs to run in an environment with .env.local loaded or keys manually provided if they aren't in process.env

async function testSpeed() {
    console.log('Starting TLD check benchmark...');
    const start = performance.now();

    // Check default TLDs
    const result = await checkTldRegistrations(domain);

    const end = performance.now();
    console.log(`TLD Check took ${(end - start).toFixed(2)}ms`);
    console.log('Result:', result);
}

testSpeed().catch(console.error);
