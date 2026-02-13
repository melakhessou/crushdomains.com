import { calculateFallbackPrice } from '../src/lib/appraisal-fallback';

const testDomains = [
    "example.com",
    "coolshop.com",
    "my-app.net",
    "app123.io", // 'app' keyword (+90), number penalty (-40), .io (+60)
    "short.ai", // len=5 (<7 -> +120), .ai (+70)
    "supercalifragilistic.com", // len=20 (>14 -> +25)
    "123456.com" // number penalty
];

console.log("Running Fallback Appraisal Tests...\n");

const fs = require('fs');
const results = testDomains.map(domain => calculateFallbackPrice(domain));
fs.writeFileSync('scripts/test-output.json', JSON.stringify(results, null, 2));
console.log('Results written to scripts/test-output.json');
