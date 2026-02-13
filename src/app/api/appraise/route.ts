import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';



const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

import { calculateFallbackPrice } from '../../../lib/appraisal-fallback';
import { evaluateBrand } from '../../../lib/brand-evaluation';

interface AppraisalResult {
    domain: string;
    source: 'primary' | 'fallback';
    liquidity_price: number | null;
    market_price: number | null;
    // Kept for frontend backward compatibility
    status: 'ok' | 'fallback_required';
    buy_now_price: number | null;
    brand_score: 'high' | 'medium' | 'low';
    brand_level: 'HIGH' | 'MEDIUM' | 'LOW';
    brand_multiplier: number;
    length: number;
    tld: string;
    word_count: number;
    error?: string;
    fallback_signals?: any;
}

// Initialize Replicate
const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { domains } = body;

        if (!domains || !Array.isArray(domains) || domains.length === 0) {
            return NextResponse.json({ error: 'Invalid domains input' }, { status: 400 });
        }

        const appraisals = await getAppraisals(domains);
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
        const results = await getAppraisals([domain]);
        const result = results[0];

        // Maintain some backward compatibility structure if needed by frontend
        // But primarily return the new structure as the "raw" result or main object
        // For now, returning the new structure directly.
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Appraisal API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}


async function getAppraisals(domains: string[]): Promise<AppraisalResult[]> {
    try {
        const input = {
            domains: domains.join(','),
        };

        const output: any = await replicate.run(
            "humbleworth/price-predict-v1:a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
            { input }
        );

        // console.log("Replicate Output:", JSON.stringify(output, null, 2));

        // The model output format validation
        // Actual output structure: { valuations: [ { domain, marketplace, auction, brokerage } ] }
        let valuations = [];
        if (output && Array.isArray(output.valuations)) {
            valuations = output.valuations;
        } else if (Array.isArray(output)) {
            // Fallback if structure varies
            valuations = output;
        } else {
            console.error("Invalid Replicate output format", output);
            return domains.map(d => createFallbackResult(d));
        }

        console.log("Valuations found:", JSON.stringify(valuations));

        return domains.map((domain, index) => {
            // Find matching result logic
            const modelResult = valuations.find((r: any) => r.domain === domain) || valuations[index];
            if (!modelResult) console.warn(`No model result for ${domain}`);
            return processModelResult(domain, modelResult);
        });

    } catch (error: any) {
        console.error("Replicate Inference Error:", error);
        // Return all fallbacks
        return domains.map(d => createFallbackResult(d, `Model inference failed: ${error.message || error}`));
    }
}

function processModelResult(domain: string, result: any): AppraisalResult {
    const metadata = extractMetadata(domain);

    // STEP 2: VALIDATE RESPONSE
    // If any critical value is missing/null/error -> fallback
    if (!result || result.error || result.marketplace === undefined || result.auction === undefined || result.brokerage === undefined) {
        return createFallbackResult(domain, result?.error || 'Invalid model output');
    }

    // STEP 3: INTERNAL PRICING MODEL
    const marketplace = Number(result.marketplace);
    const auction = Number(result.auction);
    const brokerage = Number(result.brokerage);

    if (isNaN(marketplace) || isNaN(auction) || isNaN(brokerage)) {
        return createFallbackResult(domain, 'NaN values in model output');
    }

    if (marketplace <= 0 && auction <= 0 && brokerage <= 0) {
        return createFallbackResult(domain, 'Zero values in model output');
    }

    // Brand evaluation
    const brand = evaluateBrand(domain);
    const multiplier = brand.brand_multiplier;

    const liquidity_price = Math.round(auction * multiplier);

    const market_price = Math.round(
        ((marketplace * 0.7) + (brokerage * 0.3)) * multiplier
    );

    const buy_now_price = Math.round(
        market_price * 1.18
    );

    return {
        domain,
        source: 'primary' as const,
        status: 'ok' as const,
        liquidity_price,
        market_price,
        buy_now_price,
        brand_level: brand.brand_level,
        brand_multiplier: brand.brand_multiplier,
        ...metadata
    };
}

function createFallbackResult(domain: string, errorMsg?: string): AppraisalResult {
    const metadata = extractMetadata(domain);
    const fallback = calculateFallbackPrice(domain);
    const brand = evaluateBrand(domain);
    const multiplier = brand.brand_multiplier;

    const market_price = Math.round(fallback.fallback_price * multiplier);
    const liquidity_price = Math.round(market_price * 0.6);
    const buy_now_price = Math.round(market_price * 1.5);

    // Log internally for debugging but never expose to users
    if (errorMsg) {
        console.warn(`[Fallback] ${domain}: ${errorMsg}`);
    }

    return {
        domain,
        source: 'fallback' as const,
        status: 'ok' as const,
        liquidity_price,
        market_price,
        buy_now_price,
        brand_level: brand.brand_level,
        brand_multiplier: brand.brand_multiplier,
        ...metadata,
    };
}


function extractMetadata(domain: string) {
    const parts = domain.split('.');
    const tld = parts.length > 1 ? parts[parts.length - 1] : '';
    const name = parts[0]; // simplistic, assumes no subdomains or handles them as part of name
    const length = name.length;

    // Word count approx:
    // Split by common delimiters if any (though domains usually valid hostname chars)
    // or use a simple heuristic. User said "split by dictionary detection (approx)".
    // Without a dictionary, we can try to split by some logic or just set to 1 if no clear separators.
    // Since we don't have a dictionary loaded here in Edge runtime easily, 
    // we'll stick to a very simple heuristic or just usage of hyphens if any.
    // Improved heuristic: crude estimation based on avg word length (5). 
    // Real dictionary splitting is heavy for Edge.
    const word_count = name.includes('-')
        ? name.split('-').length
        : Math.max(1, Math.round(length / 5));


    // Brand Score logic:
    // short(<10) -> high
    // medium(<15) -> medium
    // else -> low
    let brand_score: 'high' | 'medium' | 'low' = 'low';
    if (length < 10) brand_score = 'high';
    else if (length < 15) brand_score = 'medium';

    return {
        length,
        tld,
        word_count,
        brand_score
    };
}
