import { NextRequest, NextResponse } from 'next/server';

/**
 * Checks domain availability by calling the internal check-domain API.
 */
async function checkDomainAvailability(domain: string): Promise<boolean> {
    try {
        // Use an absolute URL for the internal fetch in Next.js App Router
        // Since this runs on the server, we use the local port or a relative path if supported
        // In Next.js, it's often better to call the service logic directly, but for simplicity
        // and consistency, we'll fetch the internal API route.
        const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const res = await fetch(`${origin}/api/check-domain?domain=${encodeURIComponent(domain)}`, {
            cache: 'no-store'
        });

        if (!res.ok) return false;

        const data = await res.json();
        return data.available === true;
    } catch (error) {
        console.error('[Availability Sync] Error:', error);
        return false;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    try {
        const available = await checkDomainAvailability(domain);

        return NextResponse.json({
            success: true,
            domain,
            available
        });
    } catch (error) {
        console.error('[Availability API] Error:', error);
        return NextResponse.json({
            success: false,
            domain,
            error: 'Failed to check availability'
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const domain = body.domain;

        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        const available = await checkDomainAvailability(domain);

        return NextResponse.json({
            success: true,
            domain,
            available
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Invalid request body or server error'
        }, { status: 500 });
    }
}
