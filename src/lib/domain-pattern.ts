/**
 * domain-pattern.ts
 *
 * Compiles ExpiredDomains-style pattern notation into a RegExp that tests
 * only the SLD (the label before the first dot).
 *
 * Symbol reference
 * ─────────────────────────────────────────────────────────────────
 *  C   – one consonant (bcdfghjklmnpqrstvwxyz)
 *  V   – one vowel     (aeiou)
 *  L   – one letter    (a-z)
 *  N   – one digit     (0-9)
 *  -   – literal hyphen
 *  *   – zero or more of any character (greedy)
 *
 *  Letter-repetition groups (all letters must be the same):
 *    A  = exactly 2 identical letters   (e.g. "aa")
 *    B  = exactly 3 identical letters
 *    H  = exactly 4 identical letters
 *    K  = exactly 5 identical letters
 *
 *  Digit-repetition groups (all digits must be the same):
 *    D  = exactly 2 identical digits    (e.g. "11")
 *    E  = exactly 3 identical digits
 *    F  = exactly 4 identical digits
 *    G  = exactly 5 identical digits
 * ─────────────────────────────────────────────────────────────────
 *
 * The pattern must match the *entire* SLD (anchored with ^ … $).
 * Multiple patterns can be passed separated by whitespace; a domain
 * matches if it satisfies at least one pattern.
 */

const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiou';

/** Map each pattern token to its regex fragment. */
function tokenToRegex(token: string): string {
    switch (token) {
        case 'C': return `[${CONSONANTS}]`;
        case 'V': return `[${VOWELS}]`;
        case 'L': return '[a-z]';
        case 'N': return '[0-9]';
        case '-': return '-';
        case '*': return '[a-z0-9-]*';

        // Letter repetition (same letter, n times)
        case 'A': return '([a-z])\\1{1}';      // 2 identical letters
        case 'B': return '([a-z])\\1{2}';      // 3 identical letters
        case 'H': return '([a-z])\\1{3}';      // 4 identical letters
        case 'K': return '([a-z])\\1{4}';      // 5 identical letters

        // Digit repetition (same digit, n times)
        case 'D': return '([0-9])\\1{1}';      // 2 identical digits
        case 'E': return '([0-9])\\1{2}';      // 3 identical digits
        case 'F': return '([0-9])\\1{3}';      // 4 identical digits
        case 'G': return '([0-9])\\1{4}';      // 5 identical digits

        default: return '';
    }
}

/**
 * Compiles a single pattern string into a RegExp.
 * The pattern is split character-by-character; each character is mapped
 * to a regex fragment and the result is anchored to the full SLD.
 *
 * Returns `null` if the compiled pattern would be empty/invalid.
 */
export function compilePatternToRegex(pattern: string): RegExp | null {
    const trimmed = pattern.trim().toUpperCase();
    if (!trimmed) return null;

    let regexBody = '';
    // Walk through each character of the pattern
    for (const ch of trimmed) {
        const fragment = tokenToRegex(ch);
        if (!fragment) return null; // unknown token — treat entire pattern as invalid
        regexBody += fragment;
    }

    try {
        return new RegExp(`^${regexBody}$`, 'i');
    } catch {
        return null;
    }
}

/**
 * Parses up to `maxPatterns` space-separated tokens from `raw`,
 * compiles each to a RegExp, and returns the valid ones.
 */
export function parsePatterns(raw: string, maxPatterns = 30): RegExp[] {
    return raw
        .trim()
        .split(/\s+/)
        .slice(0, maxPatterns)
        .map(compilePatternToRegex)
        .filter((r): r is RegExp => r !== null);
}

/**
 * Returns `true` if `domain` matches at least one compiled pattern.
 * The match is applied only to the SLD (everything before the first dot).
 *
 * If `patterns` is empty the function always returns `true`
 * (= no active filter).
 */
export function domainMatchesPatterns(domain: string, patterns: RegExp[]): boolean {
    if (patterns.length === 0) return true;
    const sld = domain.split('.')[0]?.toLowerCase() ?? '';
    return patterns.some((rx) => rx.test(sld));
}
