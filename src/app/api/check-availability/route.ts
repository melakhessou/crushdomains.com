import { NextRequest, NextResponse } from 'next/server';

/**
 * Placeholder function for domain availability.
 * In production, this would call a real provider like WhoisJSON, WhoisXMLAPI, etc.
 */
async function checkDomainAvailability(domain: string): Promise<boolean> {
    const apiKey = process.env.DOMAIN_AVAILABILITY_API_KEY;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Placeholder logic: 
    // For now, let's treat domains with "available" in them as available, 
    // or just return a stable result based on domain name length for demonstration.
    if (domain.includes('available') || domain.length > 15) {
        return true;
    }

    // Default to false for common domains to make it look "real"
    const commonTaken = ['google.com', 'facebook.com', 'apple.com', 'amazon.com', 'microsoft.com'];
    if (commonTaken.includes(domain.toLowerCase())) {
        return false;
    }

    // Random-ish but deterministic based on domain name
    return domain.length % 2 === 0;
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
