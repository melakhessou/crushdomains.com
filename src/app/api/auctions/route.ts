import { NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Auction {
    auction_id: number;
    domain: string;
    auction_type: string;
    current_bid_price: string;
    bids: number;
    time_left: string;
    currency?: string;
}


// ─── Vercel KV / Upstash Redis (optional, graceful degradation) ───────────────

function kvCredentials() {
    // Support both Upstash native names and Vercel KV aliases
    const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
    return { url, token };
}

async function getFromKV(key: string): Promise<string | null> {
    const { url, token } = kvCredentials();
    if (!url || !token) return null;

    try {
        const res = await fetch(`${url}/get/${key}`, {
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
        await fetch(`${url}/set/${key}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value, ex: ttl }),
            next: { revalidate: 0 },
        });
    } catch {
        // KV write failure is non-fatal
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

export async function GET() {
    const apiKey = process.env.DYNA_DOT_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            {
                error:
                    'API key missing. Add DYNA_DOT_API_KEY to your Vercel environment variables (Settings → Environment Variables).',
                auctions: [],
                cached: false,
            },
            { status: 500 }
        );
    }

    const CACHE_KEY = 'dynadot-auctions';
    const CACHE_TTL = 3600; // 1 hour in seconds

    // ── 1. Try cache first ──────────────────────────────────────────────────────
    const cached = await getFromKV(CACHE_KEY);
    if (cached) {
        try {
            const parsed = JSON.parse(cached) as { auctions: Auction[]; fetchedAt: string };
            return NextResponse.json({ ...parsed, cached: true });
        } catch {
            // Cache corrupt — fall through to fresh fetch
        }
    }

    // ── 2. Fetch from Dynadot API (paginated) ──────────────────────────────────
    // Official URL format: ?command=get_open_auctions&type=expired&count_per_page=N&page_index=N
    const COUNT_PER_PAGE = 100;
    const allAuctionList: Auction[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dynadotData: any;

    try {
        let pageIndex = 1;
        while (true) {
            const dynadotUrl = new URL('https://api.dynadot.com/api3.json');
            dynadotUrl.searchParams.set('key', apiKey);
            dynadotUrl.searchParams.set('command', 'get_open_auctions');
            dynadotUrl.searchParams.set('type', 'expired');
            dynadotUrl.searchParams.set('currency', 'USD');
            dynadotUrl.searchParams.set('count_per_page', String(COUNT_PER_PAGE));
            dynadotUrl.searchParams.set('page_index', String(pageIndex));

            const res = await fetch(dynadotUrl.toString(), { cache: 'no-store' });
            if (!res.ok) throw new Error(`Dynadot HTTP ${res.status}`);
            dynadotData = await res.json();
            console.log(`[Auctions API] page ${pageIndex} raw response:`, JSON.stringify(dynadotData));

            if (dynadotData?.status !== 'success') break; // let error handler below deal with it

            const pageItems: Auction[] = dynadotData.auction_list ?? [];
            allAuctionList.push(...pageItems);

            // Stop if we got fewer results than a full page
            if (pageItems.length < COUNT_PER_PAGE) break;
            pageIndex++;
        }
    } catch (err) {
        console.error('[Auctions API] Dynadot fetch error:', err);
        return NextResponse.json(
            { error: 'Failed to reach Dynadot API. Please try again shortly.', auctions: [], cached: false },
            { status: 502 }
        );
    }

    if (dynadotData?.status !== 'success' && allAuctionList.length === 0) {
        // Surface the exact error from the last Dynadot response
        const errMsg: string =
            dynadotData?.GetOpenAuctionsResponse?.Error ??
            dynadotData?.error ??
            dynadotData?.Error ??
            JSON.stringify(dynadotData);

        return NextResponse.json(
            { error: `Dynadot error: ${errMsg}`, _raw: dynadotData, auctions: [], cached: false },
            { status: 502 }
        );
    }

    // ── 3. Filter to expired auctions only (all should be, but be safe) ─────────
    const auctions: Auction[] = allAuctionList.filter(
        (a: Auction) => a.auction_type === 'expired'
    );

    // ── 4. Store in KV cache ────────────────────────────────────────────────────
    const fetchedAt = new Date().toISOString();
    await setToKV(CACHE_KEY, JSON.stringify({ auctions, fetchedAt }), CACHE_TTL);

    return NextResponse.json({ auctions, cached: false, fetchedAt });
}
