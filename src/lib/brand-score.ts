/**
 * Advanced Brandability Scoring Engine
 * 
 * Evaluates domain names on a 0-100 scale using multi-signal linguistic
 * and statistical analysis.
 * 
 * Modules:
 * 1. Pronounceability (30%)
 * 2. CV Phonetic Pattern (15%)
 * 3. Markov Language Probability (20%)
 * 4. Shannon Entropy (10%)
 * 5. Brand Similarity (15%)
 * 6. Length Optimization (10%)
 */

// --- 1. Advanced Pronounceability Model ---

function assessPronounceability(domain: string): number {
    let score = 0;
    const vowels = /[aeiouy]/g;
    const consonants = /[bcdfghjklmnpqrstvwxz]/g;

    const vowelMatches = domain.match(vowels);
    const vowelCount = vowelMatches ? vowelMatches.length : 0;
    const length = domain.length;

    // Vowel ratio scoring
    const ratio = vowelCount / length;
    if (ratio >= 0.3 && ratio <= 0.6) score += 15; // Ideal balance
    else if (ratio < 0.2 || ratio > 0.8) score -= 10; // Too few/many vowels

    // Penalize no vowels
    if (vowelCount === 0) score -= 20;

    // Detect consonant cluster length
    let maxConsonantCluster = 0;
    let currentCluster = 0;
    for (const char of domain) {
        if ('bcdfghjklmnpqrstvwxz'.includes(char)) {
            currentCluster++;
            maxConsonantCluster = Math.max(maxConsonantCluster, currentCluster);
        } else {
            currentCluster = 0;
        }
    }

    if (maxConsonantCluster > 3) score -= 15;
    if (maxConsonantCluster > 4) score -= 25; // Heavily penalize unpronounceable clusters

    // Detect alternating phoneme flow (simple heuristic)
    let alternations = 0;
    for (let i = 0; i < length - 1; i++) {
        const isV1 = 'aeiouy'.includes(domain[i]);
        const isV2 = 'aeiouy'.includes(domain[i + 1]);
        if (isV1 !== isV2) alternations++;
    }

    const alternationRatio = alternations / (length - 1);
    if (alternationRatio > 0.7) score += 15; // High flow

    // Estimate syllable count using heuristic vowel grouping
    // Simple heuristic: count groups of vowels as syllables, roughly
    let syllables = 0;
    let prevIsVowel = false;
    for (const char of domain) {
        const isVowel = 'aeiouy'.includes(char);
        if (isVowel && !prevIsVowel) {
            syllables++;
        }
        prevIsVowel = isVowel;
    }
    // Adjust for silent 'e' at end (very rough)
    if (domain.endsWith('e') && syllables > 1) syllables--;
    // Minimum 1 syllable if it has vowels
    if (syllables === 0 && vowelCount > 0) syllables = 1;

    // Reward 2-4 syllables
    if (syllables >= 2 && syllables <= 4) score += 10;

    // Clamp score range: -40 to +40
    return Math.max(-40, Math.min(40, score));
}


// --- 2. CV Phonetic Pattern Analysis ---

function assessPattern(domain: string): number {
    let score = 0;
    let pattern = '';

    for (const char of domain) {
        if ('aeiouy'.includes(char)) pattern += 'V';
        else if ('bcdfghjklmnpqrstvwxz'.includes(char)) pattern += 'C';
        else pattern += '?'; // Numbers/hyphens
    }

    // Reward patterns
    const favoredPatterns = ['CVCV', 'VCVC', 'CVCVC', 'CVVC', 'VCV'];
    // We check if the domain structure *repeats* these or *is* these.
    // For longer domains, looking for substrings is better.
    let hasFavored = false;
    for (const p of favoredPatterns) {
        if (pattern.includes(p)) {
            score += 10;
            hasFavored = true;
            break; // patterns overlap, just reward once for good structure
        }
    }

    // Bonus for strict structure matching on short domains
    if (favoredPatterns.includes(pattern)) score += 15;

    // Penalize
    if (pattern.includes('CCCC')) score -= 15;
    if (pattern.includes('VVVV')) score -= 10;

    // Monotone repetition (e.g., 'aaaa', 'bbbb')
    if (/(.)\1{2,}/.test(domain)) score -= 10; // 3 same chars in a row

    // Unbalanced transitions (e.g. mostly C or mostly V)
    const cCount = (pattern.match(/C/g) || []).length;
    const vCount = (pattern.match(/V/g) || []).length;
    if (cCount > vCount * 4) score -= 10; // Way too many consonants

    // Clamp score range: -25 to +25
    return Math.max(-25, Math.min(25, score));
}


// --- 3. Markov Language Probability ---

// Small built-in bigram probability table (log-probabilities or raw frequency proxy)
// This is a simplified subset of high-frequency English bigrams.
// Derived manually/generically for this implementation.
const bigrams: Record<string, number> = {
    'th': 30, 'he': 28, 'in': 25, 'er': 25, 'an': 24, 're': 21, 'on': 20,
    'at': 18, 'en': 18, 'nd': 17, 'ti': 16, 'es': 16, 'or': 15, 'te': 15,
    'of': 15, 'ed': 14, 'is': 14, 'it': 13, 'al': 13, 'ar': 12, 'st': 12,
    'to': 12, 'nt': 12, 'ng': 11, 'se': 11, 'ha': 11, 'as': 11, 'ou': 10,
    'io': 10, 'le': 10, 've': 10, 'co': 10, 'me': 10, 'de': 9, 'hi': 9,
    'ri': 9, 'ro': 9, 'ic': 9, 'ne': 8, 'ea': 8, 'ra': 8, 'ce': 8, 'li': 8,
    'ch': 8, 'll': 8, 'be': 7, 'ma': 7, 'si': 7, 'om': 7, 'ur': 7,
    // Added common brandable/start/end bigrams
    'br': 8, 'pr': 8, 'tr': 8, 'cr': 8, 'gr': 8, 'pl': 7, 'cl': 7, 'bl': 7,
    'ph': 7, 'sh': 7, 'dr': 7, 'fr': 7, 'fl': 7, 'gl': 7, 'sp': 7, 'sw': 6,
    'tw': 6, 'vo': 6, 'iv': 6, 'di': 6, 'em': 6, 'ex': 6, 'un': 6, 'ad': 6,
    'ab': 6, 'ob': 6, 'up': 6, 'fy': 6, 'ly': 10, 'my': 5, 'ny': 5, 'vy': 5
};

function assessMarkov(domain: string): number {
    let score = 0;
    let totalBigramScore = 0;
    let validBigrams = 0;

    for (let i = 0; i < domain.length - 1; i++) {
        const bg = domain.substring(i, i + 2);
        if (bigrams[bg]) {
            totalBigramScore += bigrams[bg];
        } else {
            totalBigramScore -= 5; // Penalty for rare/unnatural bigram
        }
        validBigrams++;
    }

    const avgScore = validBigrams > 0 ? totalBigramScore / validBigrams : 0;

    // Normalize roughly to range
    if (avgScore > 15) score += 20; // Very natural
    else if (avgScore > 5) score += 10; // Natural
    else if (avgScore < -3) score -= 30; // Highly unnatural (gibberish)
    else if (avgScore < -2) score -= 20; // Unnatural
    else score -= 5; // Slightly unnatural

    // Reward natural sequences specifically
    if (avgScore > 8) score += 10;

    // Clamp score range: -35 to +30
    return Math.max(-35, Math.min(30, score));
}


// --- 4. Shannon Entropy Randomness Filter ---

function assessEntropy(domain: string): number {
    const len = domain.length;
    const frequencies: Record<string, number> = {};

    for (const char of domain) {
        frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const char in frequencies) {
        const p = frequencies[char] / len;
        entropy -= p * Math.log2(p);
    }

    // entropy usually ranges 1.0 - 3.5 for domains
    // High entropy (>3.0 for short words) -> random
    // Very low entropy (<1.5 for med words) -> repetitive

    let score = 0;

    // Randomness penalty
    if (len < 8 && entropy > 2.8) score -= 20; // "xqztpk" high randomness
    else if (len >= 8 && entropy > 3.2) score -= 15;

    // Repetition penalty (low structure)
    if (len > 5 && entropy < 1.5) score -= 10; // "aaaaa"

    // Base reward for "normal" entropy
    if (entropy >= 1.5 && entropy <= 2.8) score += 20;

    // Clamp score range: -30 to +20
    return Math.max(-30, Math.min(20, score));
}


// --- 5. Brand Dataset Similarity (Embedding-lite) ---

// Small list of known brandable tokens/fragments (tech/startup style)
const brandTokens = [
    'ly', 'ify', 'hub', 'lab', 'box', 'pay', 'bet', 'air', 'pro', 'get',
    'net', 'sys', 'web', 'bit', 'bot', 'arc', 'ion', 'gen', 'pan', 'zo',
    'vox', 'tec', 'col', 'mid', 'way', 'fly', 'sky', 'key', 'pix', 'tex',
    'nex', 'hex', 'rex', 'max', 'fix', 'mix', 'q', 'z', 'x', // high value letters in right spots
    'nova', 'terra', 'aero', 'dyn', 'soft', 'sol', 'log', 'dat', 'flow',
    'sync', 'host', 'cloud', 'star', 'blue', 'red', 'one', 'go', 'up',
    'brand', 'corp', 'inc', 'ltd', 'app', 'shop', 'store', 'mart', 'market',
    'trade', 'deal', 'sale', 'buy', 'sell', 'auto', 'car', 'home', 'house',
    'life', 'live', 'love', 'good', 'best', 'top', 'hot', 'new', 'now',
    'fun', 'joy', 'play', 'game', 'win', 'bet', 'spt', 'fit', 'run',
    'health', 'med', 'care', 'doc', 'law', 'legal', 'tax', 'money', 'cash',
    'fin', 'cap', 'vest', 'bank', 'coin', 'chain', 'block', 'token', 'crypt',
    'meta', 'verse', 'cyber', 'sec', 'safe', 'guard', 'lock', 'pass', 'id',
    'auth', 'login', 'user', 'admin', 'root', 'dev', 'code', 'git', 'api',
    'sdk', 'cli', 'gui', 'ux', 'ui', 'ai', 'ml', 'bot', 'rob', 'auto',
    'mech', 'eng', 'con', 'struct', 'build', 'create', 'make', 'do', 'work',
    'job', 'task', 'list', 'note', 'book', 'read', 'write', 'learn', 'edu',
    'sch', 'uni', 'col', 'acad', 'inst', 'tut', 'men', 'guid', 'lead',
    'dir', 'map', 'nav', 'loc', 'geo', 'pos', 'place', 'spot', 'zone',
    'area', 'reg', 'land', 'world', 'globe', 'earth', 'mars', 'moon', 'sun'
];

function assessBrandSimilarity(domain: string): number {
    let score = 0;

    // Substring overlap / suffix check
    for (const token of brandTokens) {
        if (token.length < 3) continue; // Skip very short ones for basic loop
        if (domain.includes(token)) {
            score += 10;
            // Bonus if it's a suffix/prefix (common branding pattern)
            if (domain.endsWith(token) || domain.startsWith(token)) {
                score += 5;
            }
        }
    }

    // tech suffix bonus specifically
    if (domain.endsWith('ly') || domain.endsWith('ify') || domain.endsWith('ai') || domain.endsWith('io')) {
        score += 10;
    }

    // Clamp score range: -20 to +30
    return Math.max(-20, Math.min(30, score));
}


// --- 6. Length Optimization ---

function assessLength(domain: string): number {
    const len = domain.length;
    let score = 0;

    if (len >= 5 && len <= 10) score += 15; // Ideal
    else if (len >= 4 && len <= 12) score += 10; // Good
    else if (len >= 13 && len <= 15) score += 0; // Neutral
    else if (len > 15) score -= 10; // Penalty
    else if (len < 4) score -= 5; // Too short (often acronyms, harder to brand unless premium)

    // Clamp score range: -10 to +15
    return Math.max(-10, Math.min(15, score));
}

// --- Main Export ---

export type BrandLabel = 'Poor' | 'Weak' | 'Average' | 'Strong' | 'Premium';

export interface BrandScoreResult {
    score: number;
    label: BrandLabel;
    breakdown: {
        pronounceability: number;
        cvPattern: number;
        markov: number;
        entropy: number;
        brandSimilarity: number;
        length: number;
    };
}

export function scoreBrandability(domain: string): BrandScoreResult {
    // Strip TLD if present
    const parts = domain.split('.');
    const name = parts[0].toLowerCase(); // Basic strip, assumes input like "example.com" or just "example"

    const pronounceability = assessPronounceability(name);
    const cvPattern = assessPattern(name);
    const markov = assessMarkov(name);
    const entropy = assessEntropy(name);
    const brandSimilarity = assessBrandSimilarity(name);
    const length = assessLength(name);

    // Weights
    // Pronounceability → 30%
    // CV Pattern → 15%
    // Markov Probability → 20%
    // Entropy → 10%
    // Brand Similarity → 15%
    // Length → 10%

    // We need to normalize raw scores to 0-100 relative contributions.
    // Let's assume the "max" score of each component maps to 100% of its weight.
    // Max potential score of module * X = Weight * 100
    // e.g. Pronounceability max 40. 40 * X = 30 -> X = 0.75

    // Actually simpler: Normalize each -min/+max to a 0-1 scale, then apply weight.
    // But specifications gave raw ranges like -40 to +40.
    // Let's sum the raw scores directly, then normalize the TOTAL result to 0-100.

    // Total Max Possible: 40 + 25 + 30 + 20 + 30 + 15 = 160
    // Total Min Possible: -40 - 25 - 35 - 30 - 20 - 10 = -160

    // Wait, direct sum doesn't respect the percentage weights requested.
    // "Pronounceability → 30%" implies pronounceability contributes 30% of final score.

    // Let's normalize each component to 0-100 first based on its range.
    // Range: [min, max]
    // Normalized = (val - min) / (max - min) * 100

    const norm = (val: number, min: number, max: number) => {
        return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    };

    const nPron = norm(pronounceability, -40, 40);
    const nCV = norm(cvPattern, -25, 25);
    const nMarkov = norm(markov, -35, 30);
    const nEntropy = norm(entropy, -30, 20);
    const nBrand = norm(brandSimilarity, -20, 30);
    const nLen = norm(length, -10, 15);

    const finalScore = (
        nPron * 0.30 +
        nCV * 0.15 +
        nMarkov * 0.20 +
        nEntropy * 0.10 +
        nBrand * 0.15 +
        nLen * 0.10
    );

    let label: BrandLabel = 'Poor';
    if (finalScore >= 85) label = 'Premium';
    else if (finalScore >= 70) label = 'Strong';
    else if (finalScore >= 50) label = 'Average';
    else if (finalScore >= 30) label = 'Weak';

    return {
        score: Math.round(finalScore),
        label,
        breakdown: {
            pronounceability, // Return raw scores for debugging/analysis
            cvPattern,
            markov,
            entropy,
            brandSimilarity,
            length
        }
    };
}
