import { NextRequest, NextResponse } from 'next/server';

/**
 * Checks domain availability by calling the internal check-domain API.
 */
async function checkDomainAvailability(domain: string): Promise<{ available: boolean; rawStatuses: string[]; status: string } | null> {
    try {
        const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const res = await fetch(`${origin}/api/check-domain?domain=${encodeURIComponent(domain)}`, {
            cache: 'no-store'
        });

        if (!res.ok) return null;

        const data = await res.json();
        return {
            available: data.available === true,
            rawStatuses: data.rawStatuses || [],
            status: data.status || ''
        };
    } catch (error) {
        console.error('[Availability Sync] Error:', error);
        return null;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    try {
        const result = await checkDomainAvailability(domain);

        return NextResponse.json({
            success: true,
            domain,
            available: result?.available ?? false,
            rawStatuses: result?.rawStatuses ?? [],
            status: result?.status ?? ''
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

        const result = await checkDomainAvailability(domain);

        return NextResponse.json({
            success: true,
            domain,
            available: result?.available ?? false,
            rawStatuses: result?.rawStatuses ?? [],
            status: result?.status ?? ''
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Invalid request body or server error'
        }, { status: 500 });
    }
}
