// ─── Domain Name Generator ────────────────────────────────────────────────────
// Pure utility: takes keywords + TLD list → generates up to 100 unique FQDNs

const PREFIXES = [
    'get', 'try', 'my', 'go', 'the', 'use', 'pro', 'top', 'best', 'hi',
    'hey', 'one', 'all', 'any', 'new', 'ez', 'fast', 'next', 'meta', 'web',
];

const SUFFIXES = [
    'hub', 'lab', 'app', 'hq', 'io', 'ai', 'pro', 'now', 'go', 'up',
    'box', 'it', 'ly', 'ify', 'fy', 'us', 'net', 'zone', 'spot', 'co',
];

/**
 * Generate up to `max` unique domain names from keywords + TLDs.
 *
 * Patterns used:
 * - keyword alone:           crypto.com
 * - kw1+kw2 concat:          cryptoai.com
 * - kw2+kw1 concat:          aicrypto.com
 * - prefix+kw:               getcrypto.com
 * - kw+suffix:               cryptohub.com
 * - prefix+kw1+kw2:          getcryptoai.com
 * - kw1+kw2+suffix:          cryptoaihub.com
 */
export function generateDomainList(
    keywords: string[],
    tlds: string[],
    max = 100,
): string[] {
    const seen = new Set<string>();
    const results: string[] = [];

    const cleaned = keywords
        .map(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
        .filter(Boolean);

    if (cleaned.length === 0 || tlds.length === 0) return [];

    function add(sld: string) {
        if (results.length >= max) return;
        if (sld.length < 2 || sld.length > 63) return;
        for (const tld of tlds) {
            if (results.length >= max) return;
            const fqdn = `${sld}.${tld}`;
            if (!seen.has(fqdn)) {
                seen.add(fqdn);
                results.push(fqdn);
            }
        }
    }

    // 1. Each keyword alone
    for (const kw of cleaned) add(kw);

    // 2. Pair combinations (kw1+kw2, kw2+kw1)
    for (let i = 0; i < cleaned.length; i++) {
        for (let j = 0; j < cleaned.length; j++) {
            if (i !== j) add(cleaned[i] + cleaned[j]);
        }
    }

    // 3. Prefix + keyword
    for (const kw of cleaned) {
        for (const p of PREFIXES) {
            add(p + kw);
        }
    }

    // 4. Keyword + suffix
    for (const kw of cleaned) {
        for (const s of SUFFIXES) {
            add(kw + s);
        }
    }

    // 5. Prefix + kw1 + kw2
    for (let i = 0; i < cleaned.length && results.length < max; i++) {
        for (let j = 0; j < cleaned.length && results.length < max; j++) {
            if (i === j) continue;
            for (const p of PREFIXES) {
                add(p + cleaned[i] + cleaned[j]);
            }
        }
    }

    // 6. kw1 + kw2 + suffix
    for (let i = 0; i < cleaned.length && results.length < max; i++) {
        for (let j = 0; j < cleaned.length && results.length < max; j++) {
            if (i === j) continue;
            for (const s of SUFFIXES) {
                add(cleaned[i] + cleaned[j] + s);
            }
        }
    }

    return results.slice(0, max);
}
