import { NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Auction {
    auction_id: number;
    domain: string;
    auction_type: string;
    current_bid_price: string;
    bids: number;
    time_left: string;
    time_left_hours: number;   // computed
    tld: string;   // computed
    currency?: string;
}

// ─── Time parser ──────────────────────────────────────────────────────────────
// Handles: "2d 3h 5min", "23h 45min", "0 sec", "9 hours, 7 min", "1d"

export function parseTimeLeftHours(raw: string): number {
    if (!raw) return Infinity;
    const s = raw.toLowerCase();
    let hours = 0;
    const days = s.match(/(\d+)\s*d/);
    const hrs = s.match(/(\d+)\s*h/);
    const mins = s.match(/(\d+)\s*m/);
    if (days) hours += parseInt(days[1]) * 24;
    if (hrs) hours += parseInt(hrs[1]);
    if (mins) hours += parseInt(mins[1]) / 60;
    return hours;
}

// ─── Vercel KV / Upstash Redis ────────────────────────────────────────────────

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
    } catch { return null; }
}

async function setToKV(key: string, value: string, ttl: number): Promise<void> {
    const { url, token } = kvCredentials();
    if (!url || !token) return;
    try {
        await fetch(`${url}/set/${encodeURIComponent(key)}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, ex: ttl }),
            next: { revalidate: 0 },
        });
    } catch { /* non-fatal */ }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

// Single master cache key — we cache ALL auctions once, filter per request in memory.
const MASTER_CACHE_KEY = 'dynadot-auctions-v2';
const CACHE_TTL = 1800; // 30 min

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // ── Filter params ────────────────────────────────────────────────────────
    const forceRefresh = searchParams.get('force') === '1';
    const priceMax = Math.min(parseFloat(searchParams.get('priceMax') ?? '500'), 9999);
    const bidsFilter = (searchParams.get('bids') ?? 'all') as 'low' | 'mid' | 'hot' | 'all';
    const timeFilter = (searchParams.get('time') ?? 'all') as '24h' | '48h' | 'all';
    const tldsParam = searchParams.get('tlds') ?? '';
    const tldSet = tldsParam ? new Set(tldsParam.split(',').map(t => t.trim().toLowerCase())) : null;

    const apiKey = process.env.DYNA_DOT_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'API key missing. Add DYNA_DOT_API_KEY to your environment variables.', auctions: [], cached: false },
            { status: 500 }
        );
    }

    // ── Try master cache first ────────────────────────────────────────────────
    let allAuctions: Auction[] = [];
    let fetchedAt = new Date().toISOString();
    let fromCache = false;

    if (!forceRefresh) {
        const cached = await getFromKV(MASTER_CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached) as { auctions: Auction[]; fetchedAt: string };
                if (parsed.auctions?.length > 0) {
                    allAuctions = parsed.auctions;
                    fetchedAt = parsed.fetchedAt;
                    fromCache = true;
                }
            } catch { /* corrupt — fall through */ }
        }
    }

    // ── Fresh fetch if cache miss ─────────────────────────────────────────────
    if (!fromCache) {
        const COUNT_PER_PAGE = 500;
        const allRaw: unknown[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let dynadotData: any;

        try {
            let pageIndex = 1;
            const MAX_PAGES = 10; // cap at 5,000 domains max
            while (pageIndex <= MAX_PAGES) {
                const dynadotUrl = new URL('https://api.dynadot.com/api3.json');
                dynadotUrl.searchParams.set('key', apiKey);
                dynadotUrl.searchParams.set('command', 'get_open_auctions');
                dynadotUrl.searchParams.set('type', 'expired');
                dynadotUrl.searchParams.set('currency', 'USD');
                dynadotUrl.searchParams.set('count_per_page', String(COUNT_PER_PAGE));
                dynadotUrl.searchParams.set('page_index', String(pageIndex));

                const res = await fetch(dynadotUrl.toString(), {
                    cache: 'no-store',
                    signal: AbortSignal.timeout(20_000), // 20s per page max
                });
                if (!res.ok) throw new Error(`Dynadot HTTP ${res.status}`);

                // Strip bad control characters before JSON.parse
                const rawText = await res.text();
                // eslint-disable-next-line no-control-regex
                const cleanText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
                dynadotData = JSON.parse(cleanText);
                console.log(`[Auctions] page ${pageIndex}: status=${dynadotData?.status}`);

                if (dynadotData?.status !== 'success') break;

                const nested = dynadotData?.GetOpenAuctionsResponse?.AuctionList;
                const pageItems = Array.isArray(nested)
                    ? nested
                    : Array.isArray(dynadotData.auction_list)
                        ? dynadotData.auction_list
                        : [];

                allRaw.push(...pageItems);
                if (pageItems.length < COUNT_PER_PAGE) break;
                pageIndex++;
            }
        } catch (err) {
            console.error('[Auctions] Dynadot fetch error:', err);
            return NextResponse.json(
                { error: 'Failed to reach Dynadot API. Please try again shortly.', auctions: [], cached: false },
                { status: 502 }
            );
        }

        if (dynadotData?.status !== 'success' && allRaw.length === 0) {
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

        // Normalise
        allAuctions = allRaw.map((item) => {
            const r = item as Record<string, unknown>;
            const domain = (r.domain ?? r.Domain ?? '') as string;
            const tldParts = domain.split('.');
            const tld = tldParts.length > 1 ? tldParts[tldParts.length - 1].toLowerCase() : '';
            const timeLeft = String(r.time_left ?? r.TimeLeft ?? '');
            return {
                auction_id: (r.auction_id ?? r.AuctionId ?? r.auctionId ?? 0) as number,
                domain,
                tld,
                auction_type: (r.auction_type ?? r.AuctionType ?? 'expired') as string,
                current_bid_price: String(r.current_bid_price ?? r.CurrentBidPrice ?? r.min_bid ?? r.MinBidPrice ?? '0'),
                bids: Number(r.bids ?? r.Bids ?? r.bid_count ?? 0),
                time_left: timeLeft,
                time_left_hours: parseTimeLeftHours(timeLeft),
                currency: (r.currency ?? r.Currency ?? 'USD') as string,
            };
        }).filter(a => a.domain !== '');

        fetchedAt = new Date().toISOString();

        // Cache master list if non-empty
        if (allAuctions.length > 0) {
            await setToKV(MASTER_CACHE_KEY, JSON.stringify({ auctions: allAuctions, fetchedAt }), CACHE_TTL);
        }
    }

    // ── In-memory filter (fast, no extra Dynadot calls) ──────────────────────
    const auctions = allAuctions.filter((a) => {
        const price = parseFloat(a.current_bid_price);

        if (!isNaN(price) && price > priceMax) return false;
        if (bidsFilter === 'low' && a.bids >= 5) return false;
        if (bidsFilter === 'mid' && (a.bids < 5 || a.bids > 20)) return false;
        if (bidsFilter === 'hot' && a.bids <= 20) return false;
        if (timeFilter === '24h' && a.time_left_hours > 24) return false;
        if (timeFilter === '48h' && a.time_left_hours > 48) return false;
        if (tldSet && !tldSet.has(a.tld)) return false;

        return true;
    });

    return NextResponse.json({
        auctions,
        cached: fromCache,
        fetchedAt,
        total: allAuctions.length,
    });
}
