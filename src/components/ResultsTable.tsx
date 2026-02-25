'use client';

import { Gavel, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { Auction } from '@/lib/auctions-service';

// ─── Types & Props ─────────────────────────────────────────────────────────────

export type SortBy = 'domain' | 'endTime' | 'price' | 'bids' | 'visitors' | 'links' | 'age' | 'appraisal';
export type SortDir = 'asc' | 'desc';
export type PageSize = 25 | 50 | 100 | 200;

interface Props {
    auctions: Auction[];
    isLoading: boolean;
    sortBy: SortBy;
    sortDir: SortDir;
    onSort: (col: SortBy) => void;
    pageSize: PageSize;
    onPageSizeChange: (size: PageSize) => void;
    currentPage: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    onResetFilters: () => void;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function tldStyle(tld: string): string {
    const map: Record<string, string> = {
        com: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        net: 'bg-amber-100  text-amber-700  border-amber-200',
        io: 'bg-blue-100   text-blue-700   border-blue-200',
        org: 'bg-purple-100 text-purple-700 border-purple-200',
        co: 'bg-cyan-100   text-cyan-700   border-cyan-200',
        ai: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
        xyz: 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return map[tld] || 'bg-slate-100 text-slate-600 border-slate-200';
}

function parsePrice(str: string) {
    return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
}

function parseDynaAppraisal(raw: string | null): number {
    if (!raw) return 0;
    return parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
}

function formatNumber(n: number | null): string {
    if (n == null) return '—';
    return n.toLocaleString();
}

function SortIcon({ col, sortBy, dir }: { col: SortBy; sortBy: SortBy; dir: SortDir }) {
    if (col !== sortBy) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />;
    return dir === 'asc'
        ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
        : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />;
}

function SkeletonRows() {
    return (
        <>
            {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 10 }, (_, j) => (
                        <td key={j} className="px-3 py-3">
                            <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${50 + (j * 7) % 40}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResultsTable({
    auctions,
    isLoading,
    sortBy,
    sortDir,
    onSort,
    pageSize,
    onPageSizeChange,
    currentPage,
    onPageChange,
    totalItems,
    onResetFilters
}: Props) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPageSafe = Math.min(currentPage, totalPages);

    const cols: { key: SortBy; label: string; hideOnMobile?: boolean }[] = [
        { key: 'domain', label: 'Domain Name' },
        { key: 'endTime', label: 'Time Left' },
        { key: 'price', label: 'Current Bid' },
        { key: 'bids', label: 'Bids' },
        { key: 'visitors', label: 'Visitors', hideOnMobile: true },
        { key: 'appraisal', label: 'Dynappraisal', hideOnMobile: true },
        { key: 'links', label: 'Links', hideOnMobile: true },
        { key: 'age', label: 'Age', hideOnMobile: true },
    ];

    const thClass = 'px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-indigo-600 transition-colors';

    return (
        <div className="flex flex-col">
            {/* ── Pagination ── */}
            {totalItems > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/20">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-medium">Show</span>
                        <select
                            value={pageSize}
                            onChange={e => onPageSizeChange(Number(e.target.value) as PageSize)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>
                        <span className="font-medium">per page</span>
                    </div>

                    <span className="text-xs text-slate-500 font-medium">
                        Page <strong className="text-slate-700">{currentPageSafe}</strong> / {totalPages}
                        <span className="ml-2 text-slate-400">({totalItems} results)</span>
                    </span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPageSafe <= 1}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Prev
                        </button>
                        <button
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPageSafe >= totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-base" style={{ minWidth: 960 }}>
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                TLD
                            </th>
                            {cols.map(({ key, label, hideOnMobile }) => (
                                <th
                                    key={key}
                                    className={clsx(thClass, hideOnMobile && 'hidden lg:table-cell')}
                                    onClick={() => onSort(key)}
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        {label}
                                        <SortIcon col={key} sortBy={sortBy} dir={sortDir} />
                                    </span>
                                </th>
                            ))}
                            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <SkeletonRows />
                        ) : auctions.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <Gavel className="w-10 h-10 text-slate-300" />
                                        <p className="font-semibold text-slate-500">No auctions found</p>
                                        <p className="text-xs max-w-xs text-center text-slate-400">
                                            No auctions match the current filters. Try adjusting your criteria.
                                        </p>
                                        <button
                                            onClick={onResetFilters}
                                            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            auctions.map((auction) => {
                                const price = parsePrice(auction.current_bid_price);
                                const isUrgent = (auction.time_left_hours ?? Infinity) < 24;
                                const appraisal = parseDynaAppraisal(auction.dyna_appraisal);
                                const bidUrl = `https://www.dynadot.com/market/auction/${auction.domain}?r=crushdomains`;
                                return (
                                    <tr key={auction.auction_id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-3 py-3">
                                            <span className={clsx('px-1.5 py-0.5 rounded-md text-xs font-bold border whitespace-nowrap font-mono uppercase tracking-tight', tldStyle(auction.tld ?? ''))}>
                                                .{auction.tld}
                                            </span>
                                        </td>
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
                                        <td className={clsx('px-3 py-3 text-xs font-medium whitespace-nowrap', isUrgent ? 'text-red-500' : 'text-slate-500')}>
                                            {isUrgent && '⏰ '}{auction.time_left}
                                        </td>
                                        <td className="px-3 py-3 font-mono font-semibold text-slate-700">
                                            ${price.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={clsx(
                                                'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold',
                                                auction.bids > 20 ? 'bg-red-100 text-red-600' :
                                                    auction.bids < 5 ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-slate-100 text-slate-600'
                                            )}>
                                                {auction.bids > 20 ? '🔥 ' : ''}{auction.bids}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-slate-600 hidden lg:table-cell">
                                            {formatNumber(auction.visitors)}
                                        </td>
                                        <td className="px-3 py-3 hidden lg:table-cell">
                                            {appraisal > 0 ? (
                                                <span className={clsx(
                                                    'inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-bold border',
                                                    appraisal >= 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                        appraisal >= 20 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                            'bg-slate-100 text-slate-500 border-slate-200'
                                                )}>
                                                    ${appraisal.toFixed(0)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-base">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-slate-600 hidden lg:table-cell">
                                            {formatNumber(auction.links)}
                                        </td>
                                        <td className="px-3 py-3 text-base text-slate-600 hidden lg:table-cell">
                                            {auction.age != null ? (
                                                <span className={clsx(
                                                    'inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-bold font-mono',
                                                    auction.age >= 10 ? 'bg-emerald-50 text-emerald-700' :
                                                        auction.age >= 3 ? 'bg-blue-50 text-blue-700' :
                                                            'bg-slate-50 text-slate-500'
                                                )}>
                                                    {auction.age}y
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <a
                                                href={bidUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-indigo-200"
                                            >
                                                Bid <ExternalLink className="w-3 h-3 opacity-70" />
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
