'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Search, Gavel } from 'lucide-react';
import clsx from 'clsx';
import type { Auction } from '@/app/api/auctions/route';

// ─── I18n dictionary ──────────────────────────────────────────────────────────

export type Lang = 'en' | 'fr' | 'ar';

const DICT = {
    en: {
        search: 'Search domains…',
        allTlds: 'All TLDs',
        maxPrice: 'Max Price ($)',
        domain: 'Domain',
        price: 'Price (USD)',
        bids: 'Bids',
        timeLeft: 'Time Left',
        action: 'Action',
        bidNow: 'Bid Now',
        noAuctions: 'No active auctions',
        noAuctionsHint: 'Check back soon or refresh to reload from Dynadot.',
        lowBid: 'Low Bid',
        hot: 'Hot',
    },
    fr: {
        search: 'Rechercher un domaine…',
        allTlds: 'Toutes les extensions',
        maxPrice: 'Prix max ($)',
        domain: 'Domaine',
        price: 'Prix (USD)',
        bids: 'Offres',
        timeLeft: 'Temps restant',
        action: 'Action',
        bidNow: 'Enchérir',
        noAuctions: 'Aucune auction active',
        noAuctionsHint: 'Revenez bientôt ou rafraîchissez pour recharger depuis Dynadot.',
        lowBid: 'Petite offre',
        hot: 'Populaire',
    },
    ar: {
        search: 'ابحث عن نطاق…',
        allTlds: 'جميع الامتدادات',
        maxPrice: 'الحد الأقصى للسعر ($)',
        domain: 'النطاق',
        price: 'السعر (USD)',
        bids: 'العروض',
        timeLeft: 'الوقت المتبقي',
        action: 'إجراء',
        bidNow: 'قدّم عرضاً',
        noAuctions: 'لا مزادات نشطة',
        noAuctionsHint: 'تحقق لاحقاً أو أعد التحميل.',
        lowBid: 'عرض منخفض',
        hot: 'ساخن',
    },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SortKey = 'domain' | 'price' | 'bids' | 'time_left';
type SortDir = 'asc' | 'desc';

function parsePrice(str: string): number {
    return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
}

function parseTld(domain: string): string {
    const parts = domain.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
    if (col !== sortKey) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
    return dir === 'asc'
        ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
        : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRows() {
    return (
        <>
            {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-slate-100">
                    {[1, 2, 3, 4, 5].map((j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${60 + j * 8}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface TableAuctionsProps {
    auctions: Auction[];
    isLoading: boolean;
    lang?: Lang;
}

export function TableAuctions({ auctions, isLoading, lang = 'en' }: TableAuctionsProps) {
    const t = DICT[lang];
    const isRtl = lang === 'ar';

    const [search, setSearch] = useState('');
    const [tldFilter, setTldFilter] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('price');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    const uniqueTlds = useMemo(
        () => Array.from(new Set(auctions.map((a) => parseTld(a.domain)).filter(Boolean))).sort(),
        [auctions]
    );

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortKey(key); setSortDir('asc'); }
    };

    const filtered = useMemo(() => {
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        return auctions
            .filter((a) => {
                if (search && !a.domain.toLowerCase().includes(search.toLowerCase())) return false;
                if (tldFilter && parseTld(a.domain) !== tldFilter) return false;
                if (parsePrice(a.current_bid_price) > max) return false;
                return true;
            })
            .sort((a, b) => {
                let cmp = 0;
                if (sortKey === 'domain') cmp = a.domain.localeCompare(b.domain);
                else if (sortKey === 'price') cmp = parsePrice(a.current_bid_price) - parsePrice(b.current_bid_price);
                else if (sortKey === 'bids') cmp = a.bids - b.bids;
                else if (sortKey === 'time_left') cmp = a.time_left.localeCompare(b.time_left);
                return sortDir === 'asc' ? cmp : -cmp;
            });
    }, [auctions, search, tldFilter, maxPrice, sortKey, sortDir]);

    const thClass =
        'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-indigo-600 transition-colors';

    return (
        <div className={clsx('flex flex-col gap-4', isRtl && 'text-right')} dir={isRtl ? 'rtl' : 'ltr'}>
            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t.search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
                {/* TLD filter */}
                <select
                    value={tldFilter}
                    onChange={(e) => setTldFilter(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                    <option value="">{t.allTlds}</option>
                    {uniqueTlds.map((tld) => (
                        <option key={tld} value={tld}>.{tld}</option>
                    ))}
                </select>
                {/* Max price */}
                <input
                    type="number"
                    min={0}
                    placeholder={t.maxPrice}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-36 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full min-w-[700px] text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                            {([
                                ['domain', t.domain],
                                ['price', t.price],
                                ['bids', t.bids],
                                ['time_left', t.timeLeft],
                            ] as [SortKey, string][]).map(([key, label]) => (
                                <th key={key} className={thClass} onClick={() => handleSort(key)}>
                                    <span className="inline-flex items-center gap-1.5">
                                        {label}
                                        <SortIcon col={key} sortKey={sortKey} dir={sortDir} />
                                    </span>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {t.action}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <SkeletonRows />
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <Gavel className="w-10 h-10 text-slate-300" />
                                        <p className="font-semibold text-slate-500">{t.noAuctions}</p>
                                        <p className="text-xs max-w-xs">{t.noAuctionsHint}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((auction) => {
                                const price = parsePrice(auction.current_bid_price);
                                const isLowBid = price < 50;
                                const isHot = auction.bids > 10;
                                const bidUrl = `https://www.dynadot.com/market/auction.html?auctionId=${auction.auction_id}&r=crushdomains`;
                                return (
                                    <tr
                                        key={auction.auction_id}
                                        className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors"
                                    >
                                        {/* Domain */}
                                        <td className="px-4 py-3 font-semibold text-slate-800">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {auction.domain}
                                                {isLowBid && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                                        {t.lowBid}
                                                    </span>
                                                )}
                                                {isHot && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                                                        🔥 {t.hot}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Price */}
                                        <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                                            ${price.toFixed(2)}
                                        </td>
                                        {/* Bids */}
                                        <td className="px-4 py-3 text-slate-600">{auction.bids}</td>
                                        {/* Time left */}
                                        <td className="px-4 py-3 text-slate-500 font-medium">{auction.time_left}</td>
                                        {/* Bid now */}
                                        <td className="px-4 py-3">
                                            <a
                                                href={bidUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-lg transition-all duration-150 shadow-sm shadow-indigo-200"
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

            {!isLoading && filtered.length > 0 && (
                <p className="text-xs text-slate-400 text-right">
                    {filtered.length} auction{filtered.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
}
