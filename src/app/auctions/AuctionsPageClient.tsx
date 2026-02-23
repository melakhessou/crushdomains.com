'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Gavel, SlidersHorizontal, X } from 'lucide-react';
import clsx from 'clsx';
import type { Auction } from '@/app/api/auctions/route';
import { parsePatterns, domainMatchesPatterns } from '@/lib/domain-pattern';
import { DynadotFilters, type FilterState, SUPPORTED_TLDS } from '@/components/DynadotFilters';
import { ResultsTable, type SortBy, type SortDir, type PageSize } from '@/components/ResultsTable';

const DYNADOT_AFF_LINK = 'https://www.dynadot.com/?rsc=crushdomains&rsctrn=crushdomains&rscreg=crushdomains&rsceh=crushdomains&rscsb=crushdomains&rscco=crushdomains&rscbo=crushdomains';
const LS_KEY_TLDS = 'crush-auctions-tlds';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(str: string) {
    return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
}

function parseDynaAppraisal(raw: string | null): number {
    if (!raw) return 0;
    return parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    auctions: Auction[];
    generatedAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuctionsPageClient({ auctions, generatedAt }: Props) {
    const router = useRouter();

    // ── Filter state ─────────────────────────────────────────────────────────
    const [showFilters, setShowFilters] = useState(true);
    const [filters, setFilters] = useState<FilterState>({
        selectedTlds: [],
        maxPrice: null,
        minBids: 0,
        search: '',
        patternInput: ''
    });
    const [patternHelpOpen, setPatternHelpOpen] = useState(false);

    // ── Load / Save Preferences ──────────────────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem(LS_KEY_TLDS);
        if (saved) {
            try {
                const tlds = JSON.parse(saved);
                if (Array.isArray(tlds)) {
                    setFilters(prev => ({ ...prev, selectedTlds: tlds }));
                }
            } catch { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(LS_KEY_TLDS, JSON.stringify(filters.selectedTlds));
    }, [filters.selectedTlds]);

    // Compiled regexes — recomputed only when patternInput changes
    const patternRegexes = useMemo(() => parsePatterns(filters.patternInput), [filters.patternInput]);

    // ── Sort state ───────────────────────────────────────────────────────────
    const [sortBy, setSortBy] = useState<SortBy>('endTime');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // ── Pagination state ─────────────────────────────────────────────────────
    const [pageSize, setPageSize] = useState<PageSize>(25);
    const [currentPage, setCurrentPage] = useState(1);

    // ── Refresh ──────────────────────────────────────────────────────────────
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 2000);
    }, [router]);

    const handleSort = useCallback((col: SortBy) => {
        if (sortBy === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(col);
            setSortDir('asc');
        }
    }, [sortBy]);

    const resetPage = useCallback(() => setCurrentPage(1), []);

    // ── Filter + Sort (100% local) ───────────────────────────────────────────
    const filteredAndSorted = useMemo(() => {
        let list = [...auctions];

        // TLD filter (multi)
        if (filters.selectedTlds.length > 0) {
            list = list.filter(a => filters.selectedTlds.includes(a.tld));
        }
        if (filters.maxPrice !== null && filters.maxPrice > 0) {
            list = list.filter(a => parsePrice(a.current_bid_price) <= (filters.maxPrice as number));
        }
        if (filters.minBids > 0) {
            list = list.filter(a => a.bids >= filters.minBids);
        }
        if (filters.search.trim() !== '') {
            const q = filters.search.toLowerCase();
            list = list.filter(a => a.domain.toLowerCase().includes(q));
        }
        if (patternRegexes.length > 0) {
            list = list.filter(a => domainMatchesPatterns(a.domain, patternRegexes));
        }

        list.sort((a, b) => {
            let va: number, vb: number;
            switch (sortBy) {
                case 'endTime':
                    va = a.time_left_hours ?? Infinity;
                    vb = b.time_left_hours ?? Infinity;
                    break;
                case 'price':
                    va = parsePrice(a.current_bid_price);
                    vb = parsePrice(b.current_bid_price);
                    break;
                case 'bids':
                    va = a.bids; vb = b.bids;
                    break;
                case 'visitors':
                    va = a.visitors ?? 0; vb = b.visitors ?? 0;
                    break;
                case 'links':
                    va = a.links ?? 0; vb = b.links ?? 0;
                    break;
                case 'age':
                    va = a.age ?? 0; vb = b.age ?? 0;
                    break;
                case 'appraisal':
                    va = parseDynaAppraisal(a.dyna_appraisal);
                    vb = parseDynaAppraisal(b.dyna_appraisal);
                    break;
                case 'domain':
                    return sortDir === 'asc'
                        ? a.domain.localeCompare(b.domain)
                        : b.domain.localeCompare(a.domain);
                default:
                    va = 0; vb = 0;
            }
            return sortDir === 'asc' ? va - vb : vb - va;
        });

        return list;
    }, [auctions, filters, patternRegexes, sortBy, sortDir]);

    // ── Pagination ───────────────────────────────────────────────────────────
    const totalItems = filteredAndSorted.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPageSafe = Math.min(currentPage, totalPages);
    const startIndex = (currentPageSafe - 1) * pageSize;
    const pageItems = filteredAndSorted.slice(startIndex, startIndex + pageSize);

    const activeFilterCount = [
        filters.selectedTlds.length > 0,
        filters.maxPrice !== null && filters.maxPrice > 0,
        filters.minBids > 0,
        filters.search.trim() !== '',
        filters.patternInput.trim() !== '',
    ].filter(Boolean).length;

    const resetFilters = useCallback(() => {
        setFilters({
            selectedTlds: [],
            maxPrice: null,
            minBids: 0,
            search: '',
            patternInput: ''
        });
        resetPage();
    }, [resetPage]);

    const handleFilterChange = useCallback((newFilters: FilterState) => {
        setFilters(newFilters);
        resetPage();
    }, [resetPage]);

    const fetchedLabel = new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100">
            <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8 space-y-6">

                {/* ── Header ── */}
                <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-3 flex-wrap">
                            <Gavel className="w-7 h-7 text-indigo-500 flex-shrink-0" />
                            Expired Domain Auctions
                        </h1>
                        <p className="text-sm text-slate-500 font-medium max-w-xl">
                            Best expired-domain auctions from{' '}
                            <a href={DYNADOT_AFF_LINK} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2">
                                Dynadot
                            </a>
                            {' '}— filtered for deals.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all active:scale-95"
                        >
                            <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
                            {isRefreshing ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>
                </header>

                {/* ── Status bar ── */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white/60 border border-slate-200 px-2.5 py-1 rounded-full">
                        Fetched {fetchedLabel}
                    </span>
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
                        {filteredAndSorted.length} deals · {auctions.length} total
                    </span>
                </div>

                {/* ── Filter + Table card ── */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">

                    {/* Filter toggle */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                            {activeFilterCount > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                                <X className="w-3 h-3" />
                                Reset All
                            </button>
                        )}
                    </div>

                    {/* Filter bar */}
                    {showFilters && (
                        <DynadotFilters
                            filters={filters}
                            onChange={handleFilterChange}
                            totalMatches={totalItems}
                            totalAvailable={auctions.length}
                            patternHelpOpen={patternHelpOpen}
                            setPatternHelpOpen={setPatternHelpOpen}
                            patternCount={patternRegexes.length}
                        />
                    )}

                    {/* Results Table */}
                    <ResultsTable
                        auctions={pageItems}
                        isLoading={auctions.length === 0}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={handleSort}
                        pageSize={pageSize}
                        onPageSizeChange={setPageSize}
                        currentPage={currentPageSafe}
                        onPageChange={setCurrentPage}
                        totalItems={totalItems}
                        onResetFilters={resetFilters}
                    />
                </div>
            </div>
        </div>
    );
}
