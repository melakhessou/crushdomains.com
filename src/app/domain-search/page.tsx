'use client';

import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Loader2, ExternalLink, SlidersHorizontal, X, Zap, Copy } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';
import { generateDomainList } from '@/lib/domain-generator';
import BuyDomainButton from '@/components/BuyDomainButton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DomainResult {
    domain: string;
    available: 'yes' | 'no' | 'error' | 'pending';
    price: number;
    priceRaw: string;
    currency: string;
    tld: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TLDS = ['com', 'net', 'io', 'org', 'xyz'];
const DEFAULT_PRICE_MAX = 50;
const CONCURRENT_CHECKS = 1;


// ─── Main Export (Wrapper with Suspense) ──────────────────────────────────────

export default function DomainSearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
                    <p className="text-slate-500 font-medium">Loading search tools...</p>
                </div>
            </div>
        }>
            <DomainSearchContent />
        </Suspense>
    );
}

// ─── Domain Search Logic & UI ─────────────────────────────────────────────────

function DomainSearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ── Form state ────────────────────────────────────────────────────────────
    const [keywords, setKeywords] = useState(searchParams.get('keywords') ?? '');
    const [selectedTlds, setSelectedTlds] = useState<string[]>(() => {
        const t = searchParams.get('tld');
        return t ? t.split(',').filter(Boolean) : ['com', 'net', 'io'];
    });

    // ── Results & loading ─────────────────────────────────────────────────────
    const [results, setResults] = useState<DomainResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [progress, setProgress] = useState({ checked: 0, total: 0 });
    const abortRef = useRef(false);

    // ── Local filter state ────────────────────────────────────────────────────
    const [filterTld, setFilterTld] = useState(searchParams.get('filterTld') ?? 'all');
    const [priceMax, setPriceMax] = useState(
        parseInt(searchParams.get('priceMax') ?? String(DEFAULT_PRICE_MAX)),
    );
    const [availableOnly, setAvailableOnly] = useState(
        searchParams.get('availableOnly') === '1',
    );
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // ── Sync filters → URL ────────────────────────────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams();
        if (keywords) params.set('keywords', keywords);
        if (selectedTlds.length > 0) params.set('tld', selectedTlds.join(','));
        if (filterTld !== 'all') params.set('filterTld', filterTld);
        if (priceMax !== DEFAULT_PRICE_MAX) params.set('priceMax', String(priceMax));
        if (availableOnly) params.set('availableOnly', '1');

        const qs = params.toString();
        const newUrl = qs ? `/domain-search?${qs}` : '/domain-search';
        router.replace(newUrl, { scroll: false });
    }, [filterTld, priceMax, availableOnly, keywords, selectedTlds, router]);

    // ── Toggle TLD selection ──────────────────────────────────────────────────
    const toggleTld = (tld: string) => {
        setSelectedTlds(prev =>
            prev.includes(tld) ? prev.filter(t => t !== tld) : [...prev, tld],
        );
    };

    // ── Check a single domain ─────────────────────────────────────────────────
    const checkDomain = useCallback(async (domain: string): Promise<DomainResult> => {
        const tld = domain.split('.').pop() ?? '';
        try {
            const res = await fetch(`/api/search-domains?domain=${encodeURIComponent(domain)}`);
            const data = await res.json();

            if (!res.ok) {
                return { domain, available: 'error', price: 0, priceRaw: '', currency: 'USD', tld };
            }

            return data.result ?? { domain, available: 'error', price: 0, priceRaw: '', currency: 'USD', tld };
        } catch {
            return { domain, available: 'error', price: 0, priceRaw: '', currency: 'USD', tld };
        }
    }, []);

    // ── Search handler — generate locally, check sequentially ─────────────────
    const handleSearch = useCallback(async () => {
        const trimmed = keywords.trim();
        if (!trimmed) {
            toast.error('Enter at least one keyword');
            return;
        }
        if (selectedTlds.length === 0) {
            toast.error('Select at least one TLD');
            return;
        }

        // Generate domain candidates client-side
        const kws = trimmed.split(/[\s,]+/).filter(Boolean);
        const candidates = generateDomainList(kws, selectedTlds, 100);

        if (candidates.length === 0) {
            toast.error('Could not generate domain candidates');
            return;
        }

        setLoading(true);
        setSearched(true);
        abortRef.current = false;

        // Initialize all as "pending"
        const initial: DomainResult[] = candidates.map(d => ({
            domain: d,
            available: 'pending' as const,
            price: 0,
            priceRaw: '',
            currency: 'USD',
            tld: d.split('.').pop() ?? '',
        }));
        setResults(initial);
        setProgress({ checked: 0, total: candidates.length });

        toast.info(`Checking ${candidates.length} domains via Dynadot...`);

        // Concurrent queue
        let checked = 0;
        const queue = [...candidates];

        async function processNext() {
            while (queue.length > 0 && !abortRef.current) {
                const domain = queue.shift()!;
                const result = await checkDomain(domain);
                checked++;

                setResults(prev =>
                    prev.map(r => r.domain === domain ? result : r),
                );
                setProgress({ checked, total: candidates.length });
            }
        }

        // Start N concurrent workers
        const workers = Array.from({ length: CONCURRENT_CHECKS }, () => processNext());
        await Promise.all(workers);

        setLoading(false);

        const finalResults = candidates.length;
        toast.success(`Done! Checked ${checked} of ${finalResults} domains.`);
    }, [keywords, selectedTlds, checkDomain]);

    // ── Stop checking ─────────────────────────────────────────────────────────
    const handleStop = useCallback(() => {
        abortRef.current = true;
        setLoading(false);
        toast.info('Search stopped.');
    }, []);

    // ── Filtered results (local JS, no API call) ─────────────────────────────
    const filtered = useMemo(() => {
        return results.filter(r => {
            if (r.available === 'pending') return true; // always show pending
            if (filterTld !== 'all' && r.tld !== filterTld) return false;
            if (r.available === 'yes' && r.price > priceMax) return false;
            if (availableOnly && r.available !== 'yes') return false;
            return true;
        });
    }, [results, filterTld, priceMax, availableOnly]);

    const availableCount = results.filter(r => r.available === 'yes').length;
    const takenCount = results.filter(r => r.available === 'no').length;
    const pendingCount = results.filter(r => r.available === 'pending').length;
    const pct = progress.total > 0 ? Math.round((progress.checked / progress.total) * 100) : 0;

    // ── Filter sidebar content (shared desktop/mobile) ────────────────────────
    const filterContent = (
        <div className="space-y-6">
            {/* TLD Filter */}
            <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Filter TLD
                </label>
                <select
                    value={filterTld}
                    onChange={e => setFilterTld(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                >
                    <option value="all">All TLDs</option>
                    {ALL_TLDS.map(t => (
                        <option key={t} value={t}>.{t}</option>
                    ))}
                </select>
            </div>

            {/* Price slider */}
            <div className="space-y-3">
                <div className="flex justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Max Price
                    </label>
                    <span className="text-xs font-black text-indigo-600">${priceMax}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={priceMax}
                    onChange={e => setPriceMax(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>$1</span>
                    <span>$50</span>
                </div>
            </div>

            {/* Available only */}
            <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                    <input
                        type="checkbox"
                        checked={availableOnly}
                        onChange={e => setAvailableOnly(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </div>
                <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-600 transition-colors">
                    Available Only
                </span>
            </label>

            {/* Stats */}
            {searched && (
                <div className="space-y-2 pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Total</span>
                        <span className="text-slate-600">{results.length}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-emerald-500">🟢 Available</span>
                        <span className="text-emerald-600">{availableCount}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">🔴 Taken</span>
                        <span className="text-slate-500">{takenCount}</span>
                    </div>
                    {pendingCount > 0 && (
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-amber-500">⏳ Pending</span>
                            <span className="text-amber-600">{pendingCount}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-100">
                        <span className="text-indigo-500">Showing</span>
                        <span className="text-indigo-600">{filtered.length}</span>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                :root { font-family: 'Inter', sans-serif; }
                .premium-glass {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .gradient-text {
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .btn-search {
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);
                }
                .btn-search:hover:not(:disabled) {
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
                    transform: translateY(-1px);
                }
                .btn-search:disabled {
                    opacity: 0.6;
                    transform: none;
                    cursor: not-allowed;
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .shimmer {
                    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
            `}} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-20">
                {/* ── Hero ────────────────────────────────────────────────── */}
                <header className="text-center space-y-3 relative mb-12">
                    <PageTitle className="flex items-center justify-center gap-3">
                        <Search className="w-6 h-6 md:w-7 md:h-7 text-indigo-500 flex-shrink-0" />
                        Domain Search
                    </PageTitle>
                    <p className="text-base text-slate-500 font-medium mx-auto max-w-2xl">
                        Generate domain ideas from keywords and check availability + pricing on Dynadot one by one.
                    </p>
                </header>

                {/* ── Search Form ─────────────────────────────────────────── */}
                <div className="premium-glass rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 mb-10 border border-white">
                    <div className="space-y-6">
                        {/* Keywords */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Keywords
                            </label>
                            <input
                                type="text"
                                value={keywords}
                                onChange={e => setKeywords(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !loading && handleSearch()}
                                placeholder="e.g. crypto ai fitness"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium text-base"
                            />
                            <p className="text-xs text-slate-400 ml-1 font-medium">
                                Space-separated keywords. We combine them into 50–100 domain candidates and check each via Dynadot.
                            </p>
                        </div>

                        {/* TLD Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                TLDs to Search
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {ALL_TLDS.map(tld => (
                                    <button
                                        key={tld}
                                        type="button"
                                        onClick={() => toggleTld(tld)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedTlds.includes(tld)
                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm'
                                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        .{tld}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search / Stop Button */}
                        <div className="flex gap-3">
                            <button
                                onClick={loading ? handleStop : handleSearch}
                                disabled={!loading && !keywords.trim()}
                                className={`flex-1 py-4 font-bold text-lg rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${loading
                                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200'
                                    : 'btn-search text-white'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <X className="w-5 h-5" />
                                        Stop ({progress.checked}/{progress.total})
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Search Dynadot
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Progress Bar */}
                        {loading && (
                            <div className="space-y-2">
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-400">
                                    <span>{progress.checked} checked</span>
                                    <span>{pct}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Results Section ─────────────────────────────────────── */}
                {searched && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Mobile filter toggle */}
                        <button
                            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                            className="md:hidden w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
                        </button>

                        {/* Mobile filters overlay */}
                        {mobileFiltersOpen && (
                            <div className="md:hidden mb-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Filters</span>
                                    <button onClick={() => setMobileFiltersOpen(false)}>
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                                {filterContent}
                            </div>
                        )}

                        <div className="flex gap-8">
                            {/* Desktop Sidebar */}
                            <aside className="hidden md:block w-64 shrink-0">
                                <div className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-5">
                                        Filters
                                    </h3>
                                    {filterContent}
                                </div>
                            </aside>

                            {/* Results content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-xl sm:text-2xl font-black text-slate-800">Search Results</h2>
                                        <span className="text-sm font-bold text-indigo-600">
                                            {filtered.length} domain{filtered.length !== 1 ? 's' : ''} shown
                                        </span>
                                    </div>
                                    {loading && (
                                        <span className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-widest animate-pulse">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Checking...
                                        </span>
                                    )}
                                </div>

                                {filtered.length === 0 && !loading ? (
                                    <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
                                        <p className="text-slate-500 font-medium text-lg mb-2">No domains match your filters</p>
                                        <p className="text-slate-400 text-sm">Try adjusting the price range or TLD filter.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Desktop Table */}
                                        <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-100">
                                                        <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Domain</th>
                                                        <th className="text-left px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                                                        <th className="text-left px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Price</th>
                                                        <th className="text-right px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filtered.map((r, i) => (
                                                        <tr
                                                            key={r.domain}
                                                            className={`border-b border-slate-50 hover:bg-indigo-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                                                }`}
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            try {
                                                                                await navigator.clipboard.writeText(r.domain);
                                                                                const btn = e.currentTarget;
                                                                                const originalInner = btn.innerHTML;
                                                                                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-emerald-500"><path d="M20 6 9 17l-5-5"/></svg>';
                                                                                setTimeout(() => {
                                                                                    btn.innerHTML = originalInner;
                                                                                }, 2000);
                                                                            } catch (err) {
                                                                                console.error('Failed to copy: ', err);
                                                                            }
                                                                        }}
                                                                        className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-indigo-600 group"
                                                                        title="Copy domain"
                                                                    >
                                                                        <Copy size={14} className="group-hover:scale-110 transition-transform" />
                                                                    </button>
                                                                    <span className="text-lg font-bold text-slate-900 font-mono tracking-tight">
                                                                        {r.domain}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {r.available === 'pending' ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 shimmer rounded-full text-xs font-bold text-slate-400 border border-slate-100">
                                                                        ⏳ Pending
                                                                    </span>
                                                                ) : r.available === 'yes' ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                                                                        🟢 Available
                                                                    </span>
                                                                ) : r.available === 'error' ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-500 rounded-full text-xs font-bold border border-amber-100">
                                                                        ⚠️ Error
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full text-xs font-bold border border-slate-100">
                                                                        🔴 Taken
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {r.available === 'yes' ? (
                                                                    <span className="text-sm font-bold text-slate-700">
                                                                        ${r.price.toFixed(2)}{' '}
                                                                        <span className="text-slate-400 text-[10px]">{r.currency}</span>
                                                                    </span>
                                                                ) : r.available === 'pending' ? (
                                                                    <span className="text-sm text-slate-300">...</span>
                                                                ) : (
                                                                    <span className="text-sm text-slate-300">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {r.available === 'yes' ? (
                                                                    <BuyDomainButton
                                                                        domain={r.domain}
                                                                        disabled={r.available !== 'yes'}
                                                                        className="h-8 px-3 text-[10px] font-bold rounded-lg"
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-slate-300">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Cards */}
                                        <div className="md:hidden grid gap-3">
                                            {filtered.map(r => (
                                                <div
                                                    key={r.domain}
                                                    className={`border rounded-2xl p-4 transition-all hover:shadow-md ${r.available === 'pending' ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-indigo-200'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex flex-col gap-1.5 min-w-0">
                                                            <span className="text-sm font-bold text-slate-800 truncate">{r.domain}</span>
                                                            {r.available === 'pending' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 shimmer rounded-full text-xs font-bold text-slate-400 border border-slate-100 w-fit">
                                                                    ⏳ Checking...
                                                                </span>
                                                            ) : r.available === 'yes' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 w-fit">
                                                                    🟢 Available
                                                                </span>
                                                            ) : r.available === 'error' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-500 rounded-full text-xs font-bold border border-amber-100 w-fit">
                                                                    ⚠️ Error
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-xs font-bold border border-slate-100 w-fit">
                                                                    🔴 Taken
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                                            {r.available === 'yes' && (
                                                                <>
                                                                    <span className="text-sm font-bold text-slate-700">
                                                                        ${r.price.toFixed(2)}
                                                                    </span>
                                                                    <BuyDomainButton
                                                                        domain={r.domain}
                                                                        disabled={r.available !== 'yes'}
                                                                        className="h-8 px-3 text-[10px] font-bold rounded-lg"
                                                                    />
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Disclaimer */}
                                <p className="mt-8 text-xs text-slate-400 text-center font-medium">
                                    Prices and availability sourced from Dynadot. Affiliate links support CrushDomains. See{' '}
                                    <a href="/terms-of-service" className="underline hover:text-indigo-500 transition-colors">
                                        Terms of Service
                                    </a>.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <footer className="mt-24 text-center">
                    <p className="text-slate-400 text-sm font-medium">© 2026 Crush Domains • Premium Domain Engine</p>
                </footer>
            </div>
        </main>
    );
}
