/**
 * Deterministic Fallback Domain Appraisal Logic
 * 
 * Formula: base + tld_bonus + keyword_bonus + penalties
 * Minimum = 20
 */

interface FallbackSignals {
    length: number;
    tld: string;
    keyword_detected: string | null;
    penalty: number;
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
    // Parse
    const parts = domain.split('.');
    if (parts.length < 2) {
        return {
            domain,
            fallback_price: 20,
            signals: { length: domain.length, tld: '', keyword_detected: null, penalty: 0 }
        };
    }

    const tld = '.' + parts.slice(1).join('.');
    const name = parts[0];
    const length = name.length;

    // Base Score (length)
    let base = 25;
    if (length < 7) base = 120;
    else if (length < 10) base = 80;
    else if (length < 14) base = 50;

    // TLD Bonus
    let tldScore = 25;
    if (tld === '.com') tldScore = 150;
    else if (tld === '.ai') tldScore = 70;
    else if (tld === '.io') tldScore = 60;

    // Commercial Keyword Bonus
    let keywordBonus = 0;
    let detectedKeyword: string | null = null;
    for (const kw of COMMERCIAL_KEYWORDS) {
        if (name.includes(kw)) {
            keywordBonus = 90;
            detectedKeyword = kw;
            break;
        }
    }

    // Penalties
    let penalties = 0;
    if (/\d/.test(name)) penalties -= 40;
    if (name.includes('-')) penalties -= 25;

    // Final Price
    const fallbackPrice = Math.max(20, base + tldScore + keywordBonus + penalties);

    return {
        domain,
        fallback_price: fallbackPrice,
        signals: {
            length,
            tld,
            keyword_detected: detectedKeyword,
            penalty: penalties
        }
    };
}
