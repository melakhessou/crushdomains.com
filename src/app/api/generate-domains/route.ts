import { NextRequest, NextResponse } from 'next/server';

/**
 * Domain Generation Engine API
 * Generates brandable .com domain names based on keywords and niche.
 */

// --- Dictionaries ---
const NICHES: Record<string, { prefixes: string[], suffixes: string[] }> = {
    tech: {
        prefixes: ['smart', 'cyber', 'tech', 'bio', 'nano', 'cloud', 'data', 'sync', 'core', 'bit', 'byte', 'net', 'web', 'app', 'dev', 'ai'],
        suffixes: ['ly', 'ify', 'hub', 'lab', 'io', 'base', 'node', 'stack', 'flow', 'grid', 'pulse', 'wave', 'nexus', 'zen']
    },
    finance: {
        prefixes: ['pay', 'coin', 'vault', 'bank', 'fund', 'cash', 'invest', 'lend', 'bill', 'trust', 'safe', 'rich', 'wealth', 'gold'],
        suffixes: ['ly', 'ify', 'cap', 'gain', 'yield', 'mint', 'wise', 'save', 'flow', 'hub', 'stack', 'plus']
    },
    'wellness / spa': {
        prefixes: ['fit', 'med', 'life', 'cure', 'heal', 'well', 'body', 'care', 'mind', 'vital', 'pure', 'bio', 'zen', 'aura', 'spa', 'relax'],
        suffixes: ['ly', 'ify', 'well', 'care', 'path', 'hub', 'lab', 'life', 'glow', 'pulse', 'ease', 'zen', 'spa']
    },
    business: {
        prefixes: ['pro', 'elite', 'prime', 'core', 'global', 'corp', 'biz', 'strat', 'lead', 'peak', 'smart', 'main', 'first', 'top'],
        suffixes: ['ly', 'ify', 'inc', 'corp', 'hub', 'base', 'link', 'path', 'wise', 'flow', 'stack', 'grid']
    },
    'real estate': {
        prefixes: ['home', 'roof', 'land', 'stay', 'nest', 'view', 'key', 'plot', 'yard', 'place', 'base', 'dwell', 'casa', 'loft'],
        suffixes: ['ly', 'ify', 'land', 'stay', 'nest', 'view', 'hub', 'spot', 'path', 'link', 'base', 'prop']
    },
    auto: {
        prefixes: ['drive', 'moto', 'auto', 'gear', 'shift', 'ride', 'road', 'track', 'fast', 'volt', 'fuel', 'mile', 'vroom', 'turbo'],
        suffixes: ['ly', 'ify', 'auto', 'gear', 'ride', 'hub', 'track', 'flow', 'volt', 'path', 'link', 'base']
    },
    generic: {
        prefixes: ['mega', 'ultra', 'pro', 'neo', 'top', 'prime', 'elite', 'max', 'best', 'first', 'super', 'new', 'get', 'my'],
        suffixes: ['ly', 'ify', 'ia', 'is', 'os', 'um', 'it', 'er', 'ora', 'ara', 'on', 'ic', 'io', 'us']
    }
};

const EMOTIONAL_PREFIXES = ['bold', 'brave', 'pure', 'true', 'happy', 'calm', 'swift', 'smart', 'vivid', 'glow'];

// --- Helper Functions ---

function isVowel(char: string): boolean {
    return ['a', 'e', 'i', 'o', 'u', 'y'].includes(char.toLowerCase());
}

function calculateScore(domain: string, style: string): number {
    let score = 50; // Base score

    // 1. Length (Shorter is better, Max 12 chars)
    // 3 chars = +50 points, 12 chars = +0 points
    const lengthScore = Math.max(0, (13 - domain.length) * 4);
    score += lengthScore;

    // 2. Pronunciation (Vowel/Consonant balance)
    const vowels = domain.split('').filter(isVowel).length;
    const ratio = vowels / domain.length;
    if (ratio >= 0.3 && ratio <= 0.5) score += 15; // Balanced
    else if (ratio > 0.5) score -= 10; // Too many vowels
    else score -= 15; // Too many consonants

    // 3. Brandability (Style bonuses)
    if (style === 'fusion') score += 10;
    if (style === 'emotional') score += 5;

    // 4. Memorability (No double letters or awkward clusters)
    const hasDoubleLetters = /(.)\1/.test(domain);
    if (hasDoubleLetters) score -= 5;

    return Math.min(100, Math.max(0, Math.round(score)));
}

function cleanDomain(domain: string): string {
    return domain
        .toLowerCase()
        .replace(/[^a-z]/g, '') // No hyphens, no numbers
        .substring(0, 12);      // Max 12 characters
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { keyword1, keyword2, niche } = body;

        if (!keyword1 || !niche) {
            return NextResponse.json({ error: 'keyword1 and niche are required' }, { status: 400 });
        }

        const k1 = cleanDomain(keyword1);
        const k2 = keyword2 ? cleanDomain(keyword2) : '';
        const selectedNiche = NICHES[niche.toLowerCase()] || NICHES.generic;
        const results: Set<{ domain: string, score: number, style: string }> = new Set();

        const addResult = (domain: string, style: string) => {
            const cleaned = cleanDomain(domain);
            if (cleaned.length >= 3 && cleaned.length <= 12) {
                const finalDomain = `${cleaned}.com`;
                // Prevent duplicates
                if (!Array.from(results).some(r => r.domain === finalDomain)) {
                    results.add({
                        domain: finalDomain,
                        score: calculateScore(cleaned, style),
                        style
                    });
                }
            }
        };

        // --- Generation Strategy ---

        // 1. Keyword Combination (k1 + k2)
        if (k2) {
            addResult(`${k1}${k2}`, 'combination');
            addResult(`${k2}${k1}`, 'combination');
            // Fusion: k1 + start of k2
            addResult(`${k1}${k2.substring(0, 3)}`, 'fusion');
            // Fusion: k2 + start of k1
            addResult(`${k2}${k1.substring(0, 3)}`, 'fusion');
        }

        // 2. Niche Affixes
        selectedNiche.prefixes.forEach(p => addResult(`${p}${k1}`, 'prefix'));
        selectedNiche.suffixes.forEach(s => addResult(`${k1}${s}`, 'suffix'));

        if (k2) {
            selectedNiche.prefixes.slice(0, 5).forEach(p => addResult(`${p}${k2}`, 'prefix'));
            selectedNiche.suffixes.slice(0, 5).forEach(s => addResult(`${k2}${s}`, 'suffix'));
        }

        // 3. Emotional / Brandable
        EMOTIONAL_PREFIXES.forEach(p => addResult(`${p}${k1}`, 'emotional'));

        // 4. Phonetic Fusion (Portmanteau style)
        if (k2) {
            const fusion = k1.substring(0, Math.ceil(k1.length / 2)) + k2.substring(Math.floor(k2.length / 2));
            addResult(fusion, 'fusion');
        }

        // --- Post-Processing ---

        const sortedResults = Array.from(results)
            .sort((a, b) => b.score - a.score)
            .slice(0, 50); // Provide more than 30 as requested

        return NextResponse.json(sortedResults);

    } catch (error: any) {
        console.error('[Generation Engine] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
