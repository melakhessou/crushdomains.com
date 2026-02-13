/**
 * Deterministic Fallback Domain Appraisal Logic
 * 
 * Rules:
 * 1. Base Score (length)
 * 2. TLD Score
 * 3. Commercial Keyword Bonus
 * 4. Penalties (numbers, hyphens)
 * 5. Pronounceability Bonus (vowels)
 * 6. Structure Bonus (word count)
 * 7. Final Price = Sum of above (min 20)
 * 
 * Returns JSON in user-specified format.
 */

interface FallbackSignals {
    length: number;
    tld: string;
    keyword_detected: string | null;
    penalty: number;
    pronounce_bonus: number;
    structure_bonus: number;
}

interface FallbackResult {
    domain: string;
    fallback_price: number;
    signals: FallbackSignals;
}

const COMMERCIAL_KEYWORDS = [
    'pay', 'shop', 'cash', 'market', 'tech', 'coin', 'ai', 'data', 'cloud', 'host', 'app', 'web'
];

export function calculateFallbackPrice(domain: string): FallbackResult {
    // 1️⃣ Parse
    const parts = domain.split('.');
    if (parts.length < 2) {
        // Fallback for invalid domain strings
        return {
            domain,
            fallback_price: 20,
            signals: { length: domain.length, tld: '', keyword_detected: null, penalty: 0, pronounce_bonus: 0, structure_bonus: 0 }
        };
    }

    const tld = '.' + parts.slice(1).join('.'); // .com, .co.uk, etc. - simplistic handling
    const name = parts[0];
    const length = name.length;

    // 2️⃣ Base Score (length)
    let base = 25;
    if (length < 7) base = 120;
    else if (length < 10) base = 80;
    else if (length < 14) base = 50;

    // 3️⃣ TLD Score
    let tldScore = 25;
    if (tld === '.com') tldScore = 150;
    else if (tld === '.ai') tldScore = 70;
    else if (tld === '.io') tldScore = 60;

    // 4️⃣ Commercial Keyword Bonus
    let keywordBonus = 0;
    let detectedKeyword = null;
    for (const kw of COMMERCIAL_KEYWORDS) {
        if (name.includes(kw)) {
            keywordBonus = 90;
            detectedKeyword = kw;
            break;
        }
    }

    // 5️⃣ Penalties
    let penalties = 0;
    if (/\d/.test(name)) penalties -= 40;
    if (name.includes('-')) penalties -= 25;

    // 6️⃣ Pronounceability Bonus
    let pronounceBonus = 0;
    const vowelCount = (name.match(/[aeiou]/gi) || []).length;
    if (length > 0 && (vowelCount / length) > 0.30) {
        pronounceBonus = 20;
    }

    // 7️⃣ Structure Bonus
    let structureBonus = 0;
    // Estimate word count: very simplistic heuristic as requested "word count <= 2"
    // Without dictionary, we rely on implicit structure. 
    // If it has hyphens, we count parts.
    // If no hyphens, we assume it's likely 1 or 2 words if it's short, but the prompt says 
    // "Estimate word count".
    // A simple heuristic for "word count <= 2" without dictionary is hard.
    // However, the PROMPT SAID: "If estimated word count ≤ 2 → +20".
    // It also said "Parse... name = text before TLD".
    // It didn't specify HOW to estimate word count.
    // In my previous `route.ts` analysis, I saw a heuristic `Math.max(1, Math.round(length / 5))`.
    // I will use that same loose heuristic here for consistency/simplicity unless I add a dictionary.
    // Given "Deterministic", I should avoid complex external deps.
    const estimatedWordCount = name.includes('-')
        ? name.split('-').length
        : (length <= 10 ? 1 : 2); // Simple heuristic: short names are likely 1-2 words.

    if (estimatedWordCount <= 2) {
        structureBonus = 20;
    }

    // 8️⃣ Final Price
    let rawPrice = base + tldScore + keywordBonus + penalties + pronounceBonus + structureBonus;
    const fallbackPrice = Math.max(20, rawPrice);

    return {
        domain,
        fallback_price: fallbackPrice,
        signals: {
            length,
            tld,
            keyword_detected: detectedKeyword,
            penalty: penalties,
            pronounce_bonus: pronounceBonus,
            structure_bonus: structureBonus
        }
    };
}
