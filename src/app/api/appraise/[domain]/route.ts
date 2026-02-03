import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ domain: string }> } // In Next.js 15, params is a Promise
) {
    const { domain } = await params;

    if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const apiKey = process.env.GODADDY_KEY;
    const apiSecret = process.env.GODADDY_SECRET;

    if (!apiKey || !apiSecret) {
        // Return a generic error to the client, but log the specific missing config on the server
        if (!apiKey) console.error('[Appraisal API] Configuration Error: GODADDY_KEY is missing');
        if (!apiSecret) console.error('[Appraisal API] Configuration Error: GODADDY_SECRET is missing');

        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }

    try {
        const apiUrl = (process.env.GODADDY_API_URL || 'https://api.godaddy.com').replace(/\/$/, '');
        const fullUrl = `${apiUrl}/v1/appraisal/${domain}`;

        console.log(`[Appraisal] Fetching from: ${fullUrl}`);

        const response = await fetch(fullUrl, {
            headers: {
                'Authorization': `sso-key ${apiKey}:${apiSecret}`,
                'Accept': 'application/json',
                // Using a more standard/minimal User-Agent to avoid WAF blocks
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            const contentType = response.headers.get('content-type') || '';

            console.error(`[Appraisal] Error ${response.status}: ${contentType}`);

            if (contentType.includes('text/html')) {
                console.error('[Appraisal] Received HTML error (possible WAF block or Access Denied):', errorText.slice(0, 500));
                return NextResponse.json(
                    { error: 'Access denied by GoDaddy (WAF block). Please check if your API keys are correct for the Production environment and if you are using HTTPS.', details: 'HTML_ERROR_FROM_GODADDY' },
                    { status: response.status }
                );
            }

            let errorData: any = {};
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { message: errorText };
            }

            return NextResponse.json(
                { error: errorData.message || 'Failed to fetch appraisal', code: errorData.code, details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        return new NextResponse(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
                'Surrogate-Control': 'no-store',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            }
        });

    } catch (error) {
        console.error('Appraisal API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
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

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
}
