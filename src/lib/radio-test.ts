/**
 * Radio / Gibberish Test
 * 
 * Flags domains that are unpronounceable or gibberish:
 * - >5 consecutive consonants
 * - Length > 25
 * - Very low vowel ratio (< 0.15)
 * 
 * Flagged domains get fallback_price *= 0.35
 */

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

export interface RadioTestResult {
    flagged: boolean;
    reason?: string;
}

export function radioTest(domain: string): RadioTestResult {
    const parts = domain.split('.');
    const name = parts[0].toLowerCase();
    const length = name.length;

    // Check length > 25
    if (length > 25) {
        return { flagged: true, reason: 'excessive_length' };
    }

    // Check >5 consecutive consonants
    let consecutiveConsonants = 0;
    for (const ch of name) {
        if (ch === '-' || /\d/.test(ch)) {
            consecutiveConsonants = 0;
            continue;
        }
        if (!VOWELS.has(ch)) {
            consecutiveConsonants++;
            if (consecutiveConsonants > 5) {
                return { flagged: true, reason: 'consecutive_consonants' };
            }
        } else {
            consecutiveConsonants = 0;
        }
    }

    // Check vowel ratio — very low means unpronounceable
    const vowelCount = [...name].filter(ch => VOWELS.has(ch)).length;
    const letterCount = [...name].filter(ch => /[a-z]/.test(ch)).length;
    if (letterCount > 3 && (vowelCount / letterCount) < 0.15) {
        return { flagged: true, reason: 'low_vowel_ratio' };
    }

    return { flagged: false };
}
