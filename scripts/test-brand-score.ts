
import { scoreBrandability } from '../src/lib/brand-score';

const targets = [
    { domain: 'brandivo.com', expected: 'Strong/Premium' },
    { domain: 'zunexa.com', expected: 'Strong/Premium' },
    { domain: 'liftor.com', expected: 'Strong/Premium' },
    { domain: 'gfdgdfg.com', expected: 'Poor' },
    { domain: 'xqztpk.com', expected: 'Poor' }
];

console.log('--- Brand Scoring Validation ---\n');

targets.forEach(({ domain, expected }) => {
    const result = scoreBrandability(domain);
    console.log(`Domain: ${domain}`);
    console.log(`Expected: ${expected}`);
    console.log(`Actual:   ${result.label} (${result.score})`);
    console.log('Breakdown:', JSON.stringify(result.breakdown, null, 2));
    console.log('-----------------------------------');
});
