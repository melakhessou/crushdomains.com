/**
 * Brand Evaluation Engine
 * 
 * Evaluates domains on:
 *   - memorability
 *   - pronounceability
 *   - visual simplicity
 *   - brand potential
 * 
 * Returns a brand_level (HIGH | MEDIUM | LOW) and brand_multiplier.
 */

export interface BrandScore {
    domain: string;
    brand_level: 'HIGH' | 'MEDIUM' | 'LOW';
    brand_multiplier: number;
}

const MULTIPLIERS = {
    HIGH: 1.18,
    MEDIUM: 1.05,
    LOW: 0.92,
} as const;

const VOWELS = /[aeiou]/gi;

export function evaluateBrand(domain: string): BrandScore {
    const parts = domain.split('.');
    const name = parts[0];
    const length = name.length;

    const hasNumbers = /\d/.test(name);
    const hasHyphens = name.includes('-');
    const vowelCount = (name.match(VOWELS) || []).length;
    const vowelRatio = length > 0 ? vowelCount / length : 0;

    // Pronounceability: decent vowel distribution makes it speakable
    const pronounceable = vowelRatio >= 0.25 && vowelRatio <= 0.65;

    // Visual simplicity: no numbers, no hyphens, reasonably short
    const visuallySimple = !hasNumbers && !hasHyphens;

    // Compound word detection (crude): if name is medium-length with
    // good vowel spread, it's likely a readable compound
    const likelyCompound = length >= 10 && length < 16 && pronounceable && !hasHyphens;

    // --- Scoring ---

    // HIGH: short, no numbers/hyphens, pronounceable
    if (length < 10 && visuallySimple && pronounceable) {
        return { domain, brand_level: 'HIGH', brand_multiplier: MULTIPLIERS.HIGH };
    }

    // MEDIUM: readable compound words (medium length, pronounceable, clean)
    if (likelyCompound && visuallySimple) {
        return { domain, brand_level: 'MEDIUM', brand_multiplier: MULTIPLIERS.MEDIUM };
    }

    // MEDIUM: short-ish but has minor issues (e.g. short with numbers but still pronounceable)
    if (length < 10 && pronounceable && !hasHyphens) {
        return { domain, brand_level: 'MEDIUM', brand_multiplier: MULTIPLIERS.MEDIUM };
    }

    // LOW: everything else (long, complex, numeric, unpronounceable)
    return { domain, brand_level: 'LOW', brand_multiplier: MULTIPLIERS.LOW };
}
