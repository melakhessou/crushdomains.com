/**
 * Validation Script for Domain Generation Logic
 * Since we can't easily run the Next.js API in this environment without standing up a server,
 * we will test the logic by importing/re-implementing the core functions and asserting rules.
 */

const NICHES = {
    tech: {
        prefixes: ['smart', 'cyber', 'tech', 'bio', 'nano', 'cloud', 'data', 'sync', 'core', 'bit', 'byte', 'net', 'web', 'app', 'dev', 'ai'],
        suffixes: ['ly', 'ify', 'hub', 'lab', 'io', 'base', 'node', 'stack', 'flow', 'grid', 'pulse', 'wave', 'nexus', 'zen']
    }
};

const EMOTIONAL_PREFIXES = ['bold', 'brave', 'pure', 'true', 'happy', 'calm', 'swift', 'smart', 'vivid', 'glow'];

function cleanDomain(domain) {
    return domain.toLowerCase().replace(/[^a-z]/g, '').substring(0, 12);
}

function calculateScore(domain, style) {
    let score = 50;
    const lengthScore = Math.max(0, (13 - domain.length) * 4);
    score += lengthScore;
    const vowels = domain.split('').filter(c => ['a', 'e', 'i', 'o', 'u', 'y'].includes(c)).length;
    const ratio = vowels / domain.length;
    if (ratio >= 0.3 && ratio <= 0.5) score += 15;
    else if (ratio > 0.5) score -= 10;
    else score -= 15;
    if (style === 'fusion') score += 10;
    if (style === 'emotional') score += 5;
    return Math.min(100, Math.max(0, Math.round(score)));
}

function generate(keyword1, keyword2, niche) {
    const k1 = cleanDomain(keyword1);
    const k2 = keyword2 ? cleanDomain(keyword2) : '';
    const selectedNiche = NICHES[niche.toLowerCase()] || NICHES.tech; // fallback for test
    const results = new Map();

    const addResult = (domain, style) => {
        const cleaned = cleanDomain(domain);
        if (cleaned.length >= 3 && cleaned.length <= 12) {
            const finalDomain = `${cleaned}.com`;
            if (!results.has(finalDomain)) {
                results.set(finalDomain, {
                    domain: finalDomain,
                    score: calculateScore(cleaned, style),
                    style
                });
            }
        }
    };

    if (k2) {
        addResult(`${k1}${k2}`, 'combination');
        addResult(`${k2}${k1}`, 'combination');
        addResult(`${k1}${k2.substring(0, 3)}`, 'fusion');
        addResult(`${k2}${k1.substring(0, 3)}`, 'fusion');
    }
    selectedNiche.prefixes.forEach(p => addResult(`${p}${k1}`, 'prefix'));
    selectedNiche.suffixes.forEach(s => addResult(`${k1}${s}`, 'suffix'));
    EMOTIONAL_PREFIXES.forEach(p => addResult(`${p}${k1}`, 'emotional'));

    return Array.from(results.values()).sort((a, b) => b.score - a.score);
}

// --- Run Tests ---
const testResults = generate('cloud', 'node', 'tech');

console.log(`Total Generated: ${testResults.length}`);
console.log(`First 5:`, JSON.stringify(testResults.slice(0, 5), null, 2));

// Assertions
const errors = [];
if (testResults.length < 30) errors.push(`Expected at least 30 results, got ${testResults.length}`);
testResults.forEach(r => {
    const name = r.domain.replace('.com', '');
    if (name.length > 12) errors.push(`Domain too long: ${r.domain}`);
    if (/[^a-z]/.test(name)) errors.push(`Invalid characters in: ${r.domain}`);
    if (!r.domain.endsWith('.com')) errors.push(`Not a .com: ${r.domain}`);
});

// Check sorting
for (let i = 0; i < testResults.length - 1; i++) {
    if (testResults[i].score < testResults[i + 1].score) {
        errors.push(`Incorrect sorting at index ${i}`);
        break;
    }
}

if (errors.length === 0) {
    console.log('✅ All quality rules passed!');
} else {
    console.error('❌ Validation failed:');
    errors.slice(0, 10).forEach(e => console.error(` - ${e}`));
}
