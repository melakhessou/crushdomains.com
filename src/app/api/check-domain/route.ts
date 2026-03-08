import { NextRequest, NextResponse } from 'next/server';
import { checkDomainAvailability } from '@/lib/availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple In-Memory Cache
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const domainCache = new Map<string, { timestamp: number, data: any }>();

function getFromCache(domain: string) {
    const cached = domainCache.get(domain);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        domainCache.delete(domain);
        return null;
    }
    return cached.data;
}

function addToCache(domain: string, data: any) {
    if (domainCache.size > 1000) {
        const keys = Array.from(domainCache.keys());
        for (let i = 0; i < 200; i++) domainCache.delete(keys[i]);
    }
    domainCache.set(domain, { timestamp: Date.now(), data });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain')?.toLowerCase().trim();

    if (!domain) {
        return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    if (!domain.endsWith('.com')) {
        return NextResponse.json(
            { error: 'Only .com domains are supported', domain },
            { status: 400 }
        );
    }

    // Check Cache
    const cachedData = getFromCache(domain);
    if (cachedData) {
        return NextResponse.json({
            domain,
            ...cachedData
        }, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
                'X-Cache': 'HIT'
            }
        });
    }

    try {
        const result = await checkDomainAvailability(domain);

        if (!result) {
            return NextResponse.json({ error: 'Failed to check domain availability' }, { status: 502 });
        }

        const responseData = {
            available: result.available,
            rawStatuses: result.rawStatuses,
            confidence: result.confidence,
            status: result.status
        };

        // Update Cache
        addToCache(domain, responseData);

        return NextResponse.json({
            domain,
            ...responseData
        }, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
                'X-Cache': 'MISS'
            }
        });

    } catch (error: any) {
        console.error(`[API Error] Domain check failed: ${error.message}`);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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
