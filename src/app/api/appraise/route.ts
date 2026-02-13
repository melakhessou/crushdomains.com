import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

import { calculateFallbackPrice } from '../../../lib/appraisal-fallback';
import { evaluateBrand } from '../../../lib/brand-evaluation';
import { radioTest } from '../../../lib/radio-test';

// --- Types ---

interface AppraisalResult {
    domain: string;
    source: 'primary' | 'fallback';
    market_price: number;
    liquidity_price: number;
    radio_flagged: boolean;
    brand_level: 'HIGH' | 'MEDIUM' | 'LOW';
    brand_multiplier: number;
    // Kept for frontend backward compatibility
    status: 'ok';
    buy_now_price: number;
    brand_score: 'high' | 'medium' | 'low';
    length: number;
    tld: string;
    word_count: number;
}

// --- Replicate Client ---

const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
});

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

async function runPipeline(domains: string[]): Promise<AppraisalResult[]> {

    // STEP 1 — Primary Model
    const primaryResults = await callPrimaryModel(domains);

    // Process each domain through the full pipeline
    return domains.map((domain, index) => {
        const primaryResult = primaryResults[domain] || null;

        // STEP 2 — Validate primary
        const primaryValid = isPrimaryValid(primaryResult);
        const source: 'primary' | 'fallback' = primaryValid ? 'primary' : 'fallback';

        // STEP 3 — Radio / Gibberish Test
        const radio = radioTest(domain);

        // STEP 4 — Fallback Engine (always compute for blending)
        let fallbackPrice = calculateFallbackPrice(domain).fallback_price;

        // Apply radio penalty to fallback
        if (radio.flagged) {
            fallbackPrice = Math.round(fallbackPrice * 0.35);
            fallbackPrice = Math.max(20, fallbackPrice);
        }

        // STEP 5 — Brand AI Scoring
        const brand = evaluateBrand(domain);

        // STEP 6 — Comparable Sales Adjustment
        // No comparable sales data source available → adjustment = 0
        const comparableAdjustment = 0;

        // STEP 7 — Multi-Model Blending
        let primaryMarket = 0;
        if (primaryValid) {
            const mp = Number(primaryResult.marketplace);
            const bk = Number(primaryResult.brokerage);
            primaryMarket = Math.round((mp * 0.7) + (bk * 0.3));
        }

        const fallbackMarket = fallbackPrice;

        // Blend: primary×0.55 + fallback×0.15 + comparable×0.20 (remaining 0.10 is implicit)
        // When primary is unavailable, fallback carries full weight
        let blendedMarket: number;
        if (primaryValid) {
            blendedMarket = Math.round(
                (primaryMarket * 0.55) +
                (fallbackMarket * 0.15) +
                (comparableAdjustment * 0.20)
            );
        } else {
            // Fallback-only: use fallback as the full base
            blendedMarket = fallbackMarket;
        }

        // Apply brand multiplier
        const market_price = Math.round(blendedMarket * brand.brand_multiplier);
        const liquidity_price = Math.round(market_price * 0.65);

        // STEP 8 — Build output
        const metadata = extractMetadata(domain);

        return {
            domain,
            source,
            market_price,
            liquidity_price,
            radio_flagged: radio.flagged,
            brand_level: brand.brand_level,
            brand_multiplier: brand.brand_multiplier,
            // Frontend compat
            status: 'ok' as const,
            buy_now_price: Math.round(market_price * 1.18),
            ...metadata,
        };
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━
// PRIMARY MODEL CALL
// ━━━━━━━━━━━━━━━━━━━━━━━━

async function callPrimaryModel(domains: string[]): Promise<Record<string, any>> {
    try {
        const output: any = await replicate.run(
            "humbleworth/price-predict-v1:a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
            { input: { domains: domains.join(',') } }
        );

        let valuations: any[] = [];
        if (output && Array.isArray(output.valuations)) {
            valuations = output.valuations;
        } else if (Array.isArray(output)) {
            valuations = output;
        } else {
            console.error("Invalid Replicate output format", output);
            return {};
        }

        // Map by domain name for easy lookup
        const map: Record<string, any> = {};
        valuations.forEach((v: any, i: number) => {
            const key = v.domain || domains[i];
            if (key) map[key] = v;
        });
        return map;

    } catch (error: any) {
        console.warn(`[Primary] Model inference failed: ${error.message || error}`);
        return {};
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━
// VALIDATION
// ━━━━━━━━━━━━━━━━━━━━━━━━

function isPrimaryValid(result: any): boolean {
    if (!result || result.error) return false;
    if (result.marketplace === undefined || result.auction === undefined || result.brokerage === undefined) return false;

    const marketplace = Number(result.marketplace);
    const auction = Number(result.auction);
    const brokerage = Number(result.brokerage);

    if (isNaN(marketplace) || isNaN(auction) || isNaN(brokerage)) return false;
    if (marketplace <= 0 || auction <= 0 || brokerage <= 0) return false;

    return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━
// METADATA (frontend compat)
// ━━━━━━━━━━━━━━━━━━━━━━━━

function extractMetadata(domain: string) {
    const parts = domain.split('.');
    const tld = parts.length > 1 ? parts[parts.length - 1] : '';
    const name = parts[0];
    const length = name.length;

    const word_count = name.includes('-')
        ? name.split('-').length
        : Math.max(1, Math.round(length / 5));

    let brand_score: 'high' | 'medium' | 'low' = 'low';
    if (length < 10) brand_score = 'high';
    else if (length < 15) brand_score = 'medium';

    return { length, tld, word_count, brand_score };
}
