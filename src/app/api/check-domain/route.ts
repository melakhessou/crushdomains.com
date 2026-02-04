import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain')?.toLowerCase().trim();

    // 1. Validation
    if (!domain) {
        return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    if (!domain.endsWith('.com')) {
        return NextResponse.json(
            { error: 'Only .com domains are supported', domain },
            { status: 400 }
        );
    }

    // 2. Configuration
    // REQUIRED: One of these must be set in your production environment (e.g., Vercel)
    // - DOMAINR_API_KEY: Your RapidAPI key for the Domainr API
    // - FASTLY_KEY: Your Fastly API key for direct Domainr access (preferred)
    const FASTLY_KEY = process.env.FASTLY_KEY;
    const DOMAINR_API_KEY = process.env.DOMAINR_API_KEY;

    // Debug: log environment variable status
    console.log('[API Debug] FASTLY_KEY exists:', !!FASTLY_KEY, 'length:', FASTLY_KEY?.length || 0);
    console.log('[API Debug] DOMAINR_API_KEY exists:', !!DOMAINR_API_KEY, 'length:', DOMAINR_API_KEY?.length || 0);

    if (!FASTLY_KEY && !DOMAINR_API_KEY) {
        console.error('[API Error] Missing required Configuration: Set FASTLY_KEY or DOMAINR_API_KEY');
        return NextResponse.json(
            {
                error: 'Server configuration error',
                message: 'Neither FASTLY_KEY nor DOMAINR_API_KEY is configured. Check Vercel Environment Variables.',
                debug: {
                    hasFastlyKey: !!FASTLY_KEY,
                    hasDomainrKey: !!DOMAINR_API_KEY,
                    nodeEnv: process.env.NODE_ENV
                }
            },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                    'Surrogate-Control': 'no-store'
                }
            }
        );
    }

    // 3. Prepare Request Options & Rate Limiting
    // Add small delay to prevent rapid-fire blocks in some environments
    await new Promise(resolve => setTimeout(resolve, 50));

    // Prioritize Fastly Direct API as it's typically faster/cleaner
    let url: string;
    let headers: Record<string, string>;

    if (FASTLY_KEY) {
        url = `https://api.domainr.com/v2/status?domain=${domain}`;
        headers = { 'Fastly-Key': FASTLY_KEY };
    } else {
        url = `https://domainr.p.rapidapi.com/v2/status?domain=${domain}`;
        headers = {
            'x-rapidapi-key': DOMAINR_API_KEY!,
            'x-rapidapi-host': 'domainr.p.rapidapi.com'
        };
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers,
            cache: 'no-store' // Disable Next.js internal cache
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Error] Domainr API returned ${response.status}: ${errorText}`);
            return NextResponse.json(
                { error: 'Error checking domain availability', status: response.status },
                {
                    status: response.status,
                    headers: {
                        'Cache-Control': 'no-store, max-age=0',
                        'Surrogate-Control': 'no-store'
                    }
                }
            );
        }

        const data = await response.json();
        const status = data.status?.[0];

        if (!status) {
            return NextResponse.json({ error: 'Invalid response from Domainr API' }, { status: 502 });
        }

        // 4. Return standard response
        // 'undelegated' or 'inactive' typically indicates availability
        const available = status.summary === 'undelegated' || status.summary === 'inactive';

        return new NextResponse(JSON.stringify({
            domain: status.domain,
            available: available,
            status: status.summary
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
                'Surrogate-Control': 'no-store',
                'Access-Control-Allow-Origin': '*', // Adjust for production if needed
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Fastly-Key'
            }
        });

    } catch (error: any) {
        console.error(`[API Error] Domain check failed: ${error.message}`);
        return NextResponse.json(
            { error: 'Internal server error' },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                    'Surrogate-Control': 'no-store'
                }
            }
        );
    }
}

// Handle preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Fastly-Key',
            'Access-Control-Max-Age': '86400'
        }
    });
}
