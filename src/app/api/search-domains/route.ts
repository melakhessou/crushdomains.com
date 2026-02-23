import { NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DomainSearchResult {
    domain: string;
    available: 'yes' | 'no' | 'error';
    price: number;
    currency: string;
    tld: string;
}

// ─── Runtime ──────────────────────────────────────────────────────────────────

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Rate limiter (in-memory, per-instance) ──────────────────────────────────

let lastCallTs = 0;
const MIN_INTERVAL_MS = 1_100; // 1.1s between calls (Dynadot rate limit safe)

// ─── Static TLD pricing from Dynadot (approximate registration prices) ──────

const TLD_PRICES: Record<string, number> = {
    com: 10.99,
    net: 10.99,
    org: 10.99,
    io: 32.99,
    xyz: 1.99,
    ai: 69.99,
    co: 11.99,
    dev: 12.99,
    app: 14.99,
    me: 8.99,
};

// ─── Upstash KV helpers (reuse pattern from auctions route) ──────────────────

function kvCredentials() {
    const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
    return { url, token };
}

async function getFromKV(key: string): Promise<string | null> {
    const { url, token } = kvCredentials();
    if (!url || !token) return null;
    try {
        const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.result ?? null;
    } catch {
        return null;
    }
}

async function setToKV(key: string, value: string, ttl: number): Promise<void> {
    const { url, token } = kvCredentials();
    if (!url || !token) return;
    try {
        await fetch(`${url}/set/${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, ex: ttl }),
        });
    } catch {
        /* non-fatal */
    }
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_TTL = 600; // 10 minutes

// ─── GET handler — single domain search ───────────────────────────────────────
// Query: ?domain=example.com
// Dynadot search command: ONE domain per call, returns Available yes/no only.
// Pricing is looked up from a static TLD price table.

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const domain = (searchParams.get('domain') ?? '').trim().toLowerCase();

    if (!domain || !domain.includes('.')) {
        return NextResponse.json(
            { error: 'Provide a valid domain (e.g. example.com).', result: null },
            { status: 400 },
        );
    }

    const apiKey = process.env.DYNA_DOT_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'DYNA_DOT_API_KEY missing from environment.', result: null },
            { status: 500 },
        );
    }

    const tldParts = domain.split('.');
    const tld = tldParts.length > 1 ? tldParts[tldParts.length - 1] : '';

    // ── Check KV cache first ────────────────────────────────────────────────────
    const cacheKey = `dsearch:${domain}`;
    const cached = await getFromKV(cacheKey);
    if (cached) {
        try {
            const parsed = JSON.parse(cached) as DomainSearchResult;
            return NextResponse.json({ result: parsed, cached: true });
        } catch {
            /* corrupt — fall through */
        }
    }

    // ── Rate limit — sleep to enforce interval ──────────────────────────────────
    const now = Date.now();
    const wait = MIN_INTERVAL_MS - (now - lastCallTs);
    if (wait > 0) {
        await new Promise(resolve => setTimeout(resolve, wait));
    }
    lastCallTs = Date.now();

    // ── Call Dynadot Search API (single domain) ─────────────────────────────────
    // Response: {"SearchResponse":{"ResponseCode":"0","SearchResults":[{"DomainName":"x.com","Status":"success","Available":"yes|no"}]}}
    const dynadotUrl = new URL('https://api.dynadot.com/api3.json');
    dynadotUrl.searchParams.set('key', apiKey);
    dynadotUrl.searchParams.set('command', 'search');
    dynadotUrl.searchParams.set('domain0', domain);

    try {
        const res = await fetch(dynadotUrl.toString(), {
            cache: 'no-store',
            signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) {
            console.error(`[SearchDomain] Dynadot HTTP ${res.status}`);
            return NextResponse.json(
                { error: `Dynadot returned HTTP ${res.status}.`, result: null },
                { status: 502 },
            );
        }

        const rawText = await res.text();
        // eslint-disable-next-line no-control-regex
        const cleanText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
        const json = JSON.parse(cleanText);

        const searchResults = json?.SearchResponse?.SearchResults;

        if (!Array.isArray(searchResults) || searchResults.length === 0) {
            const errMsg = json?.SearchResponse?.Error ?? 'Unexpected response from Dynadot.';
            console.error('[SearchDomain] Dynadot error:', errMsg);
            return NextResponse.json(
                { error: `Dynadot: ${errMsg}`, result: null },
                { status: 502 },
            );
        }

        const item = searchResults[0];

        if (item.Status !== 'success') {
            return NextResponse.json(
                { error: `Dynadot lookup failed for ${domain}: ${item.Status}`, result: null },
                { status: 502 },
            );
        }

        const isAvailable = (item.Available ?? '').toLowerCase() === 'yes';
        const price = isAvailable ? (TLD_PRICES[tld] ?? 9.99) : 0;

        const result: DomainSearchResult = {
            domain,
            available: isAvailable ? 'yes' : 'no',
            price,
            currency: 'USD',
            tld,
        };

        // Cache result
        await setToKV(cacheKey, JSON.stringify(result), CACHE_TTL);

        return NextResponse.json({ result, cached: false });
    } catch (err) {
        console.error('[SearchDomain] Fetch error:', err);
        return NextResponse.json(
            { error: 'Failed to reach Dynadot. Please try again.', result: null },
            { status: 502 },
        );
    }
}
