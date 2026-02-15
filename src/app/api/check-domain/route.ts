import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple In-Memory Cache (Global scope persists across hot lambdas)
// Keys: domain name
// Values: { timestamp, data: { available, rawStatuses, confidence, status } }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const domainCache = new Map<string, { timestamp: number, data: any }>();

function getFromCache(domain: string) {
    const cached = domainCache.get(domain);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        domainCache.delete(domain);
        return null; // Expired
    }
    return cached.data;
}

function addToCache(domain: string, data: any) {
    // Prevent memory leaks in long-running processes (cleanup old entries)
    if (domainCache.size > 1000) {
        // Naive cleanup: clear first 200 entries to make space
        const keys = Array.from(domainCache.keys());
        for (let i = 0; i < 200; i++) domainCache.delete(keys[i]);
    }
    domainCache.set(domain, { timestamp: Date.now(), data });
}

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

    // Check Cache
    const cachedData = getFromCache(domain);
    if (cachedData) {
        return NextResponse.json({
            domain,
            available: cachedData.available,
            status: cachedData.status, // Legacy field (summary)
            rawStatuses: cachedData.rawStatuses,
            confidence: cachedData.confidence
        }, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
                'Surrogate-Control': 'no-store',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'HIT'
            }
        });
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
        const statusObj = data.status?.[0]; // Get the first status object

        if (!statusObj) {
            return NextResponse.json({ error: 'Invalid response from Domainr API' }, { status: 502 });
        }

        // 4. Robust Availability Logic
        // Normalize status.status to an array. Domainr API typically returns a space-separated string.
        const rawStatus = statusObj.status || "";
        // Ensure s is an array of strings
        const s: string[] = Array.isArray(rawStatus)
            ? rawStatus
            : rawStatus.split(/\s+/).filter(Boolean);

        // Technical status blockers that indicate the domain is NOT available for registration.
        // We include "active" because in EPP, "active" means the domain is registered.
        // "inactive" is excluded from blockers but ALSO not sufficient for availability 
        // (often means reserved/parked or in a transition state).
        const BLOCKERS = [
            "active",
            "reserved",
            "premium",
            "marketed",
            "pending",
            "clientTransferProhibited", // EPP status implying registration
            "serverTransferProhibited"  // EPP status implying registration
        ];

        // Availability Logic:
        // 1. MUST have "undelegated" status (primary signal for empty zone).
        // 2. MUST NOT have any blocking status.
        // Note: We intentionally ignore "inactive" because while it's not "active", it often flags 
        // reserved names or transitional states. "undelegated" is the gold standard for fresh registration.
        // Note: "summary" field is ignored as it masks the technical nuance we need.
        const available =
            s.includes("undelegated") &&
            !BLOCKERS.some(b => s.includes(b));

        // Confidence Level: 
        // "medium" if available (because WHOIS/DNS is never 100% strictly real-time guaranteed for purchases)
        // "high" if unavailable (blocking status codes are definitive)
        const confidence = available ? "medium" : "high";

        // Structured data to cache and return
        const responseData = {
            available,
            rawStatuses: s,
            confidence,
            status: statusObj.summary // Legacy field
        };

        // Update Cache
        addToCache(domain, responseData);

        return new NextResponse(JSON.stringify({
            domain: statusObj.domain,
            ...responseData
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
                'Surrogate-Control': 'no-store',
                'Access-Control-Allow-Origin': '*', // Adjust for production if needed
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Fastly-Key',
                'X-Cache': 'MISS'
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
