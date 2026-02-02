import { NextRequest, NextResponse } from 'next/server';

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
    const FASTLY_KEY = process.env.FASTLY_KEY;
    const DOMAINR_API_KEY = process.env.DOMAINR_API_KEY;

    if (!FASTLY_KEY && !DOMAINR_API_KEY) {
        console.error('[API Error] No Domainr API keys found in environment variables');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 3. Prepare Request Options
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
            next: { revalidate: 900 } // Cache results for 15 minutes at the edge
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API Error] Domainr API returned ${response.status}: ${errorText}`);
            return NextResponse.json(
                { error: 'Error checking domain availability', status: response.status },
                { status: response.status }
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

        return NextResponse.json({
            domain: status.domain,
            available: available,
            status: status.summary
        });

    } catch (error: any) {
        console.error(`[API Error] Domain check failed: ${error.message}`);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
