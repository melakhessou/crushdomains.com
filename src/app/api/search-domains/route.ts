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

// ─── Rate limiter (promise-based queue) ───────────────────────────────────────

let requestQueue: Promise<any> = Promise.resolve();
let lastCallTs = 0;
const MIN_INTERVAL_MS = 1_200; // 1.2s between calls (be extra safe)

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
    const url = (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? '').trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? '').trim();
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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const domain = (searchParams.get('domain') ?? '').trim().toLowerCase();

    if (!domain || !domain.includes('.')) {
        return NextResponse.json(
            { error: 'Provide a valid domain (e.g. example.com).', result: null },
            { status: 400 },
        );
    }

    const apiKey = (process.env.DYNA_DOT_API_KEY || '').trim();
    if (!apiKey) {
        return NextResponse.json(
            { error: 'DYNA_DOT_API_KEY missing from environment.', result: null },
            { status: 500 },
        );
    }

    const tldParts = domain.split('.');
    const tld = tldParts.length > 1 ? tldParts[tldParts.length - 1] : '';

    // ── Check KV cache first (outside the lock) ─────────────────────────────────
    const cacheKey = `dsearch:${domain}`;
    const cached = await getFromKV(cacheKey);
    if (cached) {
        try {
            const parsed = JSON.parse(cached) as DomainSearchResult;
            return NextResponse.json({ result: parsed, cached: true });
        } catch { /* corrupt — fall through */ }
    }

    // ── Serialize and Rate Limit ────────────────────────────────────────────────
    // We use a shared promise chain to ensure only ONE Dynadot call is in flight
    // across all incoming requests handled by this instance.
    try {
        console.log(`[SearchDomain] Queueing check for: ${domain}`);

        // requestQueue.catch(() => {}) ensures the chain NEVER breaks if a previous request fails
        const result = await (requestQueue = requestQueue.catch(() => { }).then(async () => {
            // Re-check KV inside the lock (deduplication)
            const cachedInside = await getFromKV(cacheKey);
            if (cachedInside) {
                console.log(`[SearchDomain] Cache hit (inside lock): ${domain}`);
                try {
                    return JSON.parse(cachedInside) as DomainSearchResult;
                } catch { /* ignore */ }
            }

            // Enforce interval
            const now = Date.now();
            const wait = MIN_INTERVAL_MS - (now - lastCallTs);
            if (wait > 0) {
                console.log(`[SearchDomain] Waiting ${wait}ms for rate limit: ${domain}`);
                await new Promise(resolve => setTimeout(resolve, wait));
            }

            console.log(`[SearchDomain] Calling Dynadot: ${domain}`);

            // Call Dynadot
            const dynadotUrl = new URL('https://api.dynadot.com/api3.json');
            dynadotUrl.searchParams.set('key', apiKey);
            dynadotUrl.searchParams.set('command', 'search');
            dynadotUrl.searchParams.set('domain0', domain);

            const res = await fetch(dynadotUrl.toString(), {
                cache: 'no-store',
                signal: AbortSignal.timeout(15_000),
            });

            lastCallTs = Date.now();

            if (!res.ok) {
                throw new Error(`Dynadot HTTP ${res.status}`);
            }

            const rawText = await res.text();
            const cleanText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
            const json = JSON.parse(cleanText);
            const searchResults = json?.SearchResponse?.SearchResults;

            if (!Array.isArray(searchResults) || searchResults.length === 0) {
                const errMsg = json?.SearchResponse?.Error ?? 'Unexpected response from Dynadot.';
                console.error(`[SearchDomain] Dynadot API error for ${domain}:`, errMsg);
                throw new Error(errMsg);
            }

            const item = searchResults[0];
            if (item.Status !== 'success') {
                console.error(`[SearchDomain] Dynadot Status error for ${domain}:`, item.Status);
                throw new Error(`Lookup failed: ${item.Status}`);
            }

            const isAvailable = (item.Available ?? '').toLowerCase() === 'yes';
            const price = isAvailable ? (TLD_PRICES[tld] ?? 9.99) : 0;

            const finalResult: DomainSearchResult = {
                domain,
                available: isAvailable ? 'yes' : 'no',
                price,
                currency: 'USD',
                tld,
            };

            console.log(`[SearchDomain] Result for ${domain}: ${finalResult.available}`);

            // Cache result
            await setToKV(cacheKey, JSON.stringify(finalResult), CACHE_TTL);
            return finalResult;
        }));

        return NextResponse.json({ result, cached: false });

    } catch (err: any) {
        console.error(`[SearchDomain] Error checking ${domain}:`, err.message);
        return NextResponse.json(
            { error: err.message || 'Failed to check domain.', result: null },
            { status: 502 },
        );
    }
}
