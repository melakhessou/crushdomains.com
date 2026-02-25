
import { NextRequest, NextResponse } from 'next/server';
import { appraiseDomain } from '../../../lib/appraisal-service';
import pLimit from 'p-limit';

// Define the shape of the expected response for each domain
interface BulkAppraisalResult {
    domain: string;
    auction: number;
    market: number;
    broker: number;
    error?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { domains } = body;

        // Validation: Reject if invalid body or > 200 domains
        if (!domains || !Array.isArray(domains) || domains.length === 0) {
            return NextResponse.json({ error: 'Invalid domains input' }, { status: 400 });
        }

        if (domains.length > 200) {
            return NextResponse.json({ error: 'Maximum 200 domains allowed per request' }, { status: 400 });
        }

        // Concurrency limit = 3
        const limit = pLimit(3);

        const tasks = domains.map((domain) =>
            limit(async (): Promise<BulkAppraisalResult> => {
                try {
                    // Call the appraisal service
                    const result = await appraiseDomain(domain);

                    // Attempt to extract granular data from AI provider raw response
                    const valuations = result.raw?.valuations?.[0];

                    if (valuations) {
                        return {
                            domain,
                            market: valuations.marketplace ?? result.value,
                            auction: valuations.auction ?? Math.round(result.value * 0.15),
                            broker: valuations.brokerage ?? Math.round(result.value * 0.4), // Estimate if missing
                        };
                    }

                    // Fallback logic if raw valuations are missing (e.g. local fallback or model change)
                    // We use the single 'value' returned to estimate the others
                    return {
                        domain,
                        market: result.value,
                        auction: Math.round(result.value * 0.15),
                        broker: Math.round(result.value * 0.4),
                    };

                } catch (error) {
                    console.error(`Failed to appraise ${domain}:`, error);
                    // "If API fails, return 0 values" - return 0s and do not crash
                    return {
                        domain,
                        market: 0,
                        auction: 0,
                        broker: 0,
                        error: true
                    };
                }
            })
        );

        let results = await Promise.all(tasks);

        // Default sort: Broker DESC
        results.sort((a, b) => b.broker - a.broker);

        return NextResponse.json({ results });

    } catch (error: any) {
        console.error('Bulk Appraisal API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
