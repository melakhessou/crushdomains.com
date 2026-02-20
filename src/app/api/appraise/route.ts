import { NextRequest, NextResponse } from 'next/server';
import { appraiseDomain } from '../../../lib/appraisal-service';
import { radioTest } from '../../../lib/radio-test';
import { checkTldRegistrations } from '../../../lib/tld-checker';

// --- Types ---

interface LegacyAppraisalResult {
    domain: string;
    status: 'ok' | 'fallback_required';
    market_price: number;
    liquidity_price: number;
    buy_now_price: number;
    brand_score: 'high' | 'medium' | 'low';
    brand_level: 'HIGH' | 'MEDIUM' | 'LOW';
    brand_multiplier: number;
    length: number;
    tld: string;
    word_count: number;
    tlds_registered_count: number;
    registered_tlds: string[];
    brand_score_result?: any;
    radio_flagged: boolean;
    source: string;
}

// --- API Handlers ---

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { domains } = body;

        if (!domains || !Array.isArray(domains) || domains.length === 0) {
            return NextResponse.json({ error: 'Invalid domains input' }, { status: 400 });
        }

        const appraisals = await runPipeline(domains);
        return NextResponse.json({ appraisals });
    } catch (error: any) {
        console.error('Appraisal API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    try {
        const results = await runPipeline([domain]);
        return NextResponse.json(results[0]);
    } catch (error: any) {
        console.error('Appraisal API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━
// PIPELINE
// ━━━━━━━━━━━━━━━━━━━━━━━━

async function runPipeline(domains: string[]): Promise<LegacyAppraisalResult[]> {
    return await Promise.all(domains.map(async (domain) => {
        // 1. Auxiliary Checks & Prep
        const radio = radioTest(domain);

        // Split domain for TLD/SLD
        const parts = domain.split('.');
        const sld = parts[0];
        const tld = parts.length > 1 ? parts.slice(1).join('.') : '';

        // 2. Parallel Execution: Core Appraisal + TLD Checks
        const [appraisal, tldResult] = await Promise.allSettled([
            appraiseDomain(domain),
            checkTldRegistrations(sld)
        ]);

        const appraisalValue = appraisal.status === 'fulfilled' ? appraisal.value : await import('../../../lib/appraisal-service').then(m => ({
            source: 'CrushDomains',
            value: 0,
            confidence: 'Low',
            raw: {}
        } as any)); // Type casting for simplicity in error handling

        // Fix type mismatch: tld-checker returns { tlds_registered_count, ... }
        let tldData = { tlds_registered_count: 0, registered_tlds: [] as string[] };
        if (tldResult.status === 'fulfilled') {
            tldData = tldResult.value;
        } else {
            console.warn('TLD Check failed', tldResult.reason);
        }

        // 3. Map to Legacy Frontend Format

        // Extract brand score details if available from raw fallback, otherwise ensure we have it for UI
        let brandScoreResult = appraisalValue.raw && appraisalValue.raw.brand_scoring ? appraisalValue.raw.brand_scoring : null;

        // If missing (e.g. successful Humbleworth hit), calculate it now for the UI
        if (!brandScoreResult) {
            const { scoreBrandability } = await import('../../../lib/brand-score');
            brandScoreResult = scoreBrandability(sld);
        }

        const brandLevel = brandScoreResult.label === 'Premium' || brandScoreResult.label === 'Strong' ? 'HIGH'
            : brandScoreResult.label === 'Average' ? 'MEDIUM' : 'LOW';

        return {
            domain: domain,
            status: 'ok',
            source: appraisalValue.source,

            // Pricing
            market_price: appraisalValue.value,
            liquidity_price: Math.round(appraisalValue.value * 0.15), // Est. liquidity
            buy_now_price: appraisalValue.value, // Simplified mapping

            // Brand Metadata
            brand_score: brandLevel.toLowerCase() as 'high' | 'medium' | 'low',
            brand_level: brandLevel,
            brand_multiplier: 1.0, // Deprecated conceptually but kept for type signature
            brand_score_result: brandScoreResult,

            // Radio/Gibberish
            radio_flagged: radio.flagged,

            // Domain Stats
            length: sld.length, // Length usually refers to SLD length in domaining
            tld: tld,
            word_count: sld.split('-').length, // Simple hyphen split

            // TLD registrations
            tlds_registered_count: tldData.tlds_registered_count,
            registered_tlds: tldData.registered_tlds
        };
    }));
}
