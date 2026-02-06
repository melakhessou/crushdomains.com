import { NextRequest, NextResponse } from 'next/server';

/**
 * Refined syllable counter using consonant-vowel transitions.
 */
function countSyllables(domainLabel: string): number {
    // 1. Lowercase and remove non-letters
    let word = domainLabel.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length === 0) return 1;
    if (word.length <= 3) return 1;

    const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
    let count = 0;
    let prevIsVowel = vowels.includes(word[0]);

    // Count initial vowel if exists
    if (prevIsVowel) count++;

    // 2. Count transitions: consonant -> vowel
    for (let i = 1; i < word.length; i++) {
        const isVowel = vowels.includes(word[i]);
        if (isVowel && !prevIsVowel) {
            count++;
        }
        prevIsVowel = isVowel;
    }

    // 3. Subtract 1 for trailing silent "e" (except "le" cases)
    if (word.length > 2 && word.endsWith('e') && !word.endsWith('le')) {
        // Only subtract if it's not the only "vowel group" we counted
        // e.g. "code" -> 1 transition (c->o), "de" -> would be 0 if we subtracted (but handled by min 1)
        if (count > 1) count--;
    }

    // 4. Minimum 1 syllable
    return Math.max(1, count);
}

/**
 * Calculates a custom domain score based on linguistic and market factors.
 */
function calculateDomainScore(domain: string, sld: string, factors: any): number {
    let score = 40; // Reduced base for more dynamic range

    // 1. Length (Shorter is better, SLD focus)
    const lengthScore = Math.max(0, (12 - sld.length) * 5);
    score += lengthScore;

    // 2. TLD Factor
    if (domain.endsWith('.com')) score += 15;
    else if (factors.tldTier === 'premium') score += 10;

    // 3. Brandability Signals
    if (factors.isBrandable) score += 15;
    if (factors.isDictionaryWord) score += 10;
    if (factors.isPremiumWord) score += 10;

    // 4. Syllable Penalty/Bonus
    const syllables = countSyllables(sld);
    if (syllables <= 2) score += 10;
    else if (syllables >= 5) score -= 15;

    // 5. Complexity cluster
    const hasClusters = /[^aeiouy]{3,}/i.test(sld);
    if (hasClusters) score -= 10;

    return Math.min(100, Math.max(0, Math.round(score)));
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const apiKey = process.env.DOMSCAN_API_KEY?.trim();

    if (!apiKey) {
        console.error('[Appraise API] DOMSCAN_API_KEY is missing');
        return NextResponse.json(
            { error: 'Appraisal service not configured' },
            { status: 500 }
        );
    }

    try {
        console.log(`[Appraisal] Fetching valuation for ${domain} from DomScan`);

        const response = await fetch(`https://domscan.net/v1/value?domain=${encodeURIComponent(domain)}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
                'User-Agent': 'CrushDomains/1.0'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            const status = response.status;
            const text = await response.text();
            console.error(`[Appraisal] DomScan Error ${status}: ${text}`);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch appraisal',
                    debug: {
                        status,
                        message: text.slice(0, 200)
                    }
                },
                { status: status }
            );
        }

        const data = await response.json();
        const sld = data.domain?.split('.')[0] || '';

        // Calculate custom metrics
        const syllables = countSyllables(sld);
        const domainScore = calculateDomainScore(data.domain || domain, sld, data.factors || {});

        // Normalize the response
        const normalized = {
            success: true,
            domain: data.domain,
            currency: data.estimate?.currency || 'USD',
            mid: data.estimate?.mid || 0,
            low: data.estimate?.low || 0,
            high: data.estimate?.high || 0,
            confidence: data.confidence || 0,
            domainScore: domainScore,
            sldLength: sld.length,
            syllables: syllables,
            factors: {
                length: data.factors?.length,
                tldTier: data.factors?.tldTier || 'standard',
                isDictionaryWord: data.factors?.isDictionaryWord,
                isBrandable: data.factors?.isBrandable,
                isPremiumWord: data.factors?.isPremiumWord,
                pronounceability: data.factors?.pronounceability
            }
        };

        return NextResponse.json(normalized, { status: 200 });

    } catch (error: any) {
        console.error('[Appraise API] Internal Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error while fetching appraisal'
            },
            { status: 500 }
        );
    }
}
