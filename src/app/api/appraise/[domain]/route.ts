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
        console.error('Missing GODADDY_KEY or GODADDY_SECRET environment variables');
        return NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
        );
    }

    try {
        const apiUrl = process.env.GODADDY_API_URL || 'https://api.godaddy.com';
        console.log(`[Appraisal] Fetching for ${domain} from ${apiUrl}... with key ending in ...${apiKey?.slice(-4)}`);

        const response = await fetch(`${apiUrl}/v1/appraisal/${domain}`, {
            headers: {
                'Authorization': `sso-key ${apiKey}:${apiSecret}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Appraisal] Error ${response.status}: ${errorText}`);

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
        return NextResponse.json(data);

    } catch (error) {
        console.error('Appraisal API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
