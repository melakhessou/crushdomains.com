'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Search, Gavel, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { Auction } from '@/app/api/auctions/route';

// ─── I18n ─────────────────────────────────────────────────────────────────────

export type Lang = 'en' | 'fr' | 'ar';

const DICT = {
    en: {
        search: 'Search domains…', domain: 'Domain', tld: 'TLD', price: 'Price (USD)',
        bids: 'Bids', timeLeft: 'Time Left', humble: 'HumbleWorth', dealScore: 'Deal Score',
        action: 'Action', bidNow: 'Bid Now', noDeals: 'No deals found',
        noDealsHint: (p: number) => `No auctions under $${p} with current filters. Try adjusting the slider or refreshing.`,
        lowBid: 'Low', hot: 'Hot', loading: 'Loading appraisals…',
    },
    fr: {
        search: 'Rechercher un domaine…', domain: 'Domaine', tld: 'TLD', price: 'Prix (USD)',
        bids: 'Offres', timeLeft: 'Temps restant', humble: 'HumbleWorth', dealScore: 'Score affaire',
        action: 'Action', bidNow: 'Enchérir', noDeals: 'Aucun deal trouvé',
        noDealsHint: (p: number) => `Aucune enchère <$${p} avec ces filtres. Modifiez les critères ou rafraîchissez.`,
        lowBid: 'Faible', hot: 'Populaire', loading: 'Chargement estimations…',
    },
    ar: {
        search: 'ابحث عن نطاق…', domain: 'النطاق', tld: 'TLD', price: 'السعر (USD)',
        bids: 'العروض', timeLeft: 'الوقت', humble: 'HumbleWorth', dealScore: 'نقاط الصفقة',
        action: 'إجراء', bidNow: 'قدّم عرضاً', noDeals: 'لا صفقات',
        noDealsHint: (p: number) => `لا مزادات أقل من $${p} بالفلاتر الحالية.`,
        lowBid: 'منخفض', hot: 'ساخن', loading: 'جارٍ جلب التقييمات…',
    },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SortKey = 'domain' | 'price' | 'bids' | 'time_left' | 'dealScore' | 'humble';
type SortDir = 'asc' | 'desc';

function parsePrice(str: string) { return parseFloat(str.replace(/[^0-9.]/g, '')) || 0; }

export function tldStyle(tld: string): string {
    if (tld === 'com') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (tld === 'net') return 'bg-amber-100  text-amber-700  border-amber-200';
    if (tld === 'io') return 'bg-blue-100   text-blue-700   border-blue-200';
    if (tld === 'org') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100  text-slate-600  border-slate-200';
}

// Deal Score: humbleMarket/price * competitiveness factor
export function calcDealScore(humble: number, price: number, bids: number): number {
    if (!humble || !price) return 0;
    return Math.round((humble / price) * (1 - Math.min(bids, 50) / 50) * 10) / 10;
}

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
    if (col !== sortKey) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />;
    return dir === 'asc'
        ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
        : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />;
}

function SkeletonRows() {
    return (
        <>
            {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-slate-100">
                    {[40, 80, 35, 40, 40, 50, 50, 60].map((w, j) => (
                        <td key={j} className="px-3 py-3">
                            <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${w}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// ─── HumbleWorth score badge ──────────────────────────────────────────────────

function HumbleBadge({ score }: { score: number | undefined }) {
    if (score === undefined) return <span className="text-slate-300 text-xs">—</span>;
    const color =
        score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
            score >= 50 ? 'bg-blue-100    text-blue-700    border-blue-200' :
                'bg-slate-100   text-slate-500   border-slate-200';
    return (
        <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold border', color)}>
            ${score}
        </span>
    );
}

// ─── Deal Score badge ─────────────────────────────────────────────────────────

function DealBadge({ score }: { score: number }) {
    if (!score) return <span className="text-slate-300 text-xs">—</span>;
    const color =
        score >= 5 ? 'bg-emerald-500 text-white' :
            score >= 2 ? 'bg-indigo-500  text-white' :
                'bg-slate-100   text-slate-500';
    return (
        <span className={clsx('inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold', color)}>
            {score}×
        </span>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HumbleMap { [domain: string]: number }

interface TableAuctionsProps {
    auctions: Auction[];
    isLoading: boolean;
    isHumbleLoading: boolean;
    humbleMap: HumbleMap;
    humbleMin: boolean;   // filter: only show ≥ 70
    priceMax: number;    // for empty state copy
    lang?: Lang;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TableAuctions({
    auctions, isLoading, isHumbleLoading, humbleMap, humbleMin, priceMax, lang = 'en'
}: TableAuctionsProps) {
    const t = DICT[lang];
    const isRtl = lang === 'ar';

    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('price');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir(key === 'dealScore' ? 'desc' : 'asc'); }
    };

    const enriched = useMemo(() =>
        auctions.map(a => ({
            ...a,
            humbleVal: humbleMap[a.domain] ?? undefined,
            dealScore: calcDealScore(humbleMap[a.domain] ?? 0, parsePrice(a.current_bid_price), a.bids),
        })),
        [auctions, humbleMap]
    );

    const filtered = useMemo(() => {
        return enriched
            .filter(a => {
                if (search && !a.domain.toLowerCase().includes(search.toLowerCase())) return false;
                if (humbleMin && (a.humbleVal === undefined || a.humbleVal < 70)) return false;
                return true;
            })
            .sort((a, b) => {
                let cmp = 0;
                if (sortKey === 'domain') cmp = a.domain.localeCompare(b.domain);
                else if (sortKey === 'price') cmp = parsePrice(a.current_bid_price) - parsePrice(b.current_bid_price);
                else if (sortKey === 'bids') cmp = a.bids - b.bids;
                else if (sortKey === 'time_left') cmp = (a.time_left_hours ?? 0) - (b.time_left_hours ?? 0);
                else if (sortKey === 'dealScore') cmp = a.dealScore - b.dealScore;
                else if (sortKey === 'humble') cmp = (a.humbleVal ?? -1) - (b.humbleVal ?? -1);
                return sortDir === 'asc' ? cmp : -cmp;
            });
    }, [enriched, search, humbleMin, sortKey, sortDir]);

    const thClass = 'px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-indigo-600 transition-colors';

    const cols: [SortKey, string][] = [
        ['domain', t.domain],
        ['price', t.price],
        ['bids', t.bids],
        ['time_left', t.timeLeft],
        ['humble', t.humble],
        ['dealScore', t.dealScore],
    ];

    return (
        <div className={clsx('flex flex-col gap-3', isRtl && 'text-right')} dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Search + humble loading */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="relative flex-1 min-w-[180px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t.search}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
                {isHumbleLoading && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {t.loading}
                    </span>
                )}
                {!isLoading && (
                    <span className="text-xs text-slate-400">
                        {filtered.length} / {auctions.length}
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm" style={{ minWidth: 780 }}>
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                            {/* TLD column — not sortable */}
                            <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                {t.tld}
                            </th>
                            {cols.map(([key, label]) => (
                                <th key={key} className={thClass} onClick={() => handleSort(key)}>
                                    <span className="inline-flex items-center gap-1.5">
                                        {label}
                                        <SortIcon col={key} sortKey={sortKey} dir={sortDir} />
                                    </span>
                                </th>
                            ))}
                            <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                {t.action}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <SkeletonRows />
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <Gavel className="w-10 h-10 text-slate-300" />
                                        <p className="font-semibold text-slate-500">{t.noDeals}</p>
                                        <p className="text-xs max-w-xs text-center text-slate-400">{t.noDealsHint(priceMax)}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((auction) => {
                                const price = parsePrice(auction.current_bid_price);
                                const isUrgent = (auction.time_left_hours ?? Infinity) < 24;
                                const bidUrl = `https://www.dynadot.com/market/auction.html?auctionId=${auction.auction_id}&r=crushdomains`;
                                return (
                                    <tr key={auction.auction_id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">

                                        {/* TLD badge */}
                                        <td className="px-3 py-3">
                                            <span className={clsx('px-1.5 py-0.5 rounded-md text-[10px] font-bold border', tldStyle(auction.tld ?? ''))}>
                                                .{auction.tld}
                                            </span>
                                        </td>

                                        {/* Domain */}
                                        <td className="px-3 py-3 font-semibold text-slate-800 max-w-[200px]">
                                            <a
                                                href={bidUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-indigo-600 transition-colors truncate block"
                                                title={auction.domain}
                                            >
                                                {auction.domain}
                                            </a>
                                        </td>

                                        {/* Price */}
                                        <td className="px-3 py-3 font-mono font-semibold text-slate-700">
                                            ${price.toFixed(2)}
                                        </td>

                                        {/* Bids */}
                                        <td className="px-3 py-3">
                                            <span className={clsx(
                                                'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                                                auction.bids > 20 ? 'bg-red-100 text-red-600' :
                                                    auction.bids < 5 ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-slate-100 text-slate-600'
                                            )}>
                                                {auction.bids > 20 ? '🔥 ' : ''}{auction.bids}
                                            </span>
                                        </td>

                                        {/* Time left */}
                                        <td className={clsx('px-3 py-3 text-xs font-medium', isUrgent ? 'text-red-500' : 'text-slate-500')}>
                                            {isUrgent && '⏰ '}{auction.time_left}
                                        </td>

                                        {/* HumbleWorth */}
                                        <td className="px-3 py-3">
                                            <HumbleBadge score={auction.humbleVal} />
                                        </td>

                                        {/* Deal Score */}
                                        <td className="px-3 py-3">
                                            <DealBadge score={auction.dealScore} />
                                        </td>

                                        {/* Bid button */}
                                        <td className="px-3 py-3">
                                            <a
                                                href={bidUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-indigo-200"
                                            >
                                                <Gavel className="w-3.5 h-3.5" />
                                                {t.bidNow}
                                                <ExternalLink className="w-3 h-3 opacity-70" />
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
