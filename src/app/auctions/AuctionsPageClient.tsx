'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Gavel, Clock, Globe, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { FiltersSidebar, DEFAULT_FILTERS, type Filters, type Lang as SidebarLang } from '@/components/FiltersSidebar';
import { TableAuctions, type HumbleMap, type Lang as TableLang } from '@/components/TableAuctions';
import type { Auction } from '@/app/api/auctions/route';

// ─── I18n ─────────────────────────────────────────────────────────────────────

type Lang = 'en' | 'fr' | 'ar';

const PAGE_DICT = {
    en: {
        title: 'Top Expired Deals',
        subtitle: 'Best expired-domain auctions from Dynadot — filtered for deals.',
        refresh: 'Refresh', refreshing: 'Refreshing…',
        nextRefresh: 'Next refresh in',
        cached: '(cached)', live: 'Live', fetched: 'Fetched',
        error: 'Error loading auctions.', noKey: 'Dynadot API key not configured.',
        results: (x: number, y: number) => `${x} deals · ${y} total`,
        filters: 'Filters',
    },
    fr: {
        title: 'Meilleures Offres Expirées',
        subtitle: 'Les meilleures enchères Dynadot filtrées pour vous.',
        refresh: 'Actualiser', refreshing: 'Chargement…',
        nextRefresh: 'Prochain rafraîchissement dans',
        cached: '(cache)', live: 'En direct', fetched: 'Récupéré',
        error: 'Erreur de chargement.', noKey: 'Clé API Dynadot non configurée.',
        results: (x: number, y: number) => `${x} offres · ${y} total`,
        filters: 'Filtres',
    },
    ar: {
        title: 'أفضل الصفقات',
        subtitle: 'أفضل مزادات النطاقات من Dynadot — مفلترة لك.',
        refresh: 'تحديث', refreshing: 'جارٍ التحديث…',
        nextRefresh: 'التحديث القادم خلال',
        cached: '(مخزن)', live: 'مباشر', fetched: 'جُلب',
        error: 'خطأ في التحميل.', noKey: 'مفتاح API غير مُهيَّأ.',
        results: (x: number, y: number) => `${x} صفقة · ${y} إجمالي`,
        filters: 'الفلاتر',
    },
} as const;

const LANGS: { code: Lang; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' },
];

const REFRESH_INTERVAL = 10 * 60; // 10 min
const HUMBLE_BATCH = 20;      // domains per batch

// ─── Build API URL from filters ───────────────────────────────────────────────

function buildUrl(filters: Filters, force: boolean): string {
    const p = new URLSearchParams();
    p.set('priceMax', String(filters.priceMax));
    if (filters.bids !== 'all') p.set('bids', filters.bids);
    if (filters.time !== 'all') p.set('time', filters.time);
    if (filters.tlds.size > 0) p.set('tlds', Array.from(filters.tlds).join(','));
    if (force) p.set('force', '1');
    return `/api/auctions?${p.toString()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuctionsPageClient() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMissingKey, setIsMissingKey] = useState(false);
    const [fetchedAt, setFetchedAt] = useState<string | null>(null);
    const [isCached, setIsCached] = useState(false);
    const [total, setTotal] = useState(0);
    const [lang, setLang] = useState<Lang>('en');
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
    const [filters, setFilters] = useState<Filters>(() => ({
        ...DEFAULT_FILTERS,
        tlds: new Set(DEFAULT_FILTERS.tlds),
    }));
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // HumbleWorth state
    const [humbleMap, setHumbleMap] = useState<HumbleMap>({});
    const [isHumbleLoading, setIsHumbleLoading] = useState(false);

    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const t = PAGE_DICT[lang];

    // ── Fetch auctions ─────────────────────────────────────────────────────────
    const fetchAuctions = useCallback(async (force = false) => {
        setIsLoading(true);
        setError(null);
        setCountdown(REFRESH_INTERVAL);
        setHumbleMap({});

        try {
            const res = await fetch(buildUrl(filters, force), { cache: 'no-store' });
            const data = await res.json();

            if (!res.ok) {
                if (data.error?.includes('DYNA_DOT_API_KEY') || data.error?.includes('key missing')) {
                    setIsMissingKey(true);
                } else {
                    setError(data.error ?? t.error);
                }
                setAuctions([]);
            } else {
                setAuctions(data.auctions ?? []);
                setFetchedAt(data.fetchedAt ?? new Date().toISOString());
                setIsCached(data.cached ?? false);
                setTotal(data.total ?? data.auctions?.length ?? 0);
                setIsMissingKey(false);
            }
        } catch {
            setError(t.error);
        } finally {
            setIsLoading(false);
        }
    }, [filters, t.error]);

    // ── HumbleWorth batch fetch ────────────────────────────────────────────────
    const fetchHumble = useCallback(async (domains: string[]) => {
        if (!domains.length) return;
        setIsHumbleLoading(true);
        const map: HumbleMap = {};

        for (let i = 0; i < domains.length; i += HUMBLE_BATCH) {
            const batch = domains.slice(i, i + HUMBLE_BATCH);
            try {
                const res = await fetch('/api/bulk-appraisal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domains: batch }),
                });
                if (!res.ok) continue;
                const data = await res.json();
                for (const item of data.results ?? []) {
                    map[item.domain] = item.market ?? 0;
                }
            } catch { /* non-fatal */ }
        }

        setHumbleMap(prev => ({ ...prev, ...map }));
        setIsHumbleLoading(false);
    }, []);

    // Trigger humble fetch when toggle is on and auctions load
    useEffect(() => {
        if (filters.humbleMin && auctions.length > 0) {
            const missing = auctions
                .filter(a => humbleMap[a.domain] === undefined)
                .map(a => a.domain)
                .slice(0, 200); // cap at 200 to avoid overload
            if (missing.length) fetchHumble(missing);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.humbleMin, auctions]);

    // Initial load (and when non-humble filters change)
    useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

    // Auto-refresh every 10 min
    useEffect(() => {
        const timer = setInterval(() => fetchAuctions(false), REFRESH_INTERVAL * 1000);
        return () => clearInterval(timer);
    }, [fetchAuctions]);

    // Countdown ticker
    useEffect(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setCountdown(c => c <= 1 ? REFRESH_INTERVAL : c - 1);
        }, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [fetchedAt]);

    const mins = String(Math.floor(countdown / 60)).padStart(2, '0');
    const secs = String(countdown % 60).padStart(2, '0');
    const fetchedLabel = fetchedAt
        ? new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    const isRtl = lang === 'ar';

    return (
        <div
            className={clsx('min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100', isRtl && 'text-right')}
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8 space-y-6">

                {/* ── Header ── */}
                <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-3 flex-wrap">
                            <Gavel className="w-7 h-7 text-indigo-500 flex-shrink-0" />
                            {t.title}
                        </h1>
                        <p className="text-sm text-slate-500 font-medium max-w-xl">{t.subtitle}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Lang switcher */}
                        <div className="flex items-center gap-1 bg-white/70 border border-slate-200 rounded-xl p-1 shadow-sm">
                            <Globe className="w-4 h-4 text-slate-400 mx-1" />
                            {LANGS.map(({ code, label }) => (
                                <button
                                    key={code}
                                    onClick={() => setLang(code)}
                                    className={clsx(
                                        'px-2.5 py-1 text-xs font-bold rounded-lg transition-all',
                                        lang === code ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                    )}
                                >{label}</button>
                            ))}
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={() => fetchAuctions(true)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all active:scale-95"
                        >
                            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
                            {isLoading ? t.refreshing : t.refresh}
                        </button>
                    </div>
                </header>

                {/* ── Status bar ── */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {t.live}
                    </span>

                    {fetchedLabel && (
                        <span className="inline-flex items-center gap-1 bg-white/60 border border-slate-200 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            {t.fetched} {fetchedLabel} {isCached && <span className="text-slate-400">{t.cached}</span>}
                        </span>
                    )}

                    {!isLoading && !error && (
                        <span className="bg-white/60 border border-slate-200 px-2.5 py-1 rounded-full">
                            {t.nextRefresh}: <strong>{mins}:{secs}</strong>
                        </span>
                    )}

                    {!isLoading && auctions.length > 0 && (
                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
                            {t.results(auctions.length, total)}
                        </span>
                    )}
                </div>

                {/* ── Error / Missing key ── */}
                {isMissingKey && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800">
                        <p className="font-bold text-sm">⚠️ {t.noKey}</p>
                        <code className="mt-2 block text-xs bg-amber-100 rounded-lg px-3 py-2 font-mono">
                            DYNA_DOT_API_KEY=your_key_here
                        </code>
                    </div>
                )}
                {error && !isMissingKey && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm font-medium">{error}</div>
                )}

                {/* ── Main layout: sidebar + table ── */}
                {!isMissingKey && (
                    <div className="flex gap-6 items-start">
                        <FiltersSidebar
                            filters={filters}
                            onChange={setFilters}
                            lang={lang as SidebarLang}
                            mobileOpen={mobileFiltersOpen}
                            onMobileClose={() => setMobileFiltersOpen(false)}
                        />

                        <div className="flex-1 min-w-0 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-5">
                            <TableAuctions
                                auctions={auctions}
                                isLoading={isLoading}
                                isHumbleLoading={isHumbleLoading}
                                humbleMap={humbleMap}
                                humbleMin={filters.humbleMin}
                                priceMax={filters.priceMax}
                                lang={lang as TableLang}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Mobile FAB — Filters ── */}
            <div className="lg:hidden fixed bottom-6 right-6 z-30">
                <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-300 active:scale-95 transition-all"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    {t.filters}
                    {(() => {
                        // active filter count badge
                        let count = 0;
                        if (filters.priceMax !== 100) count++;
                        if (filters.bids !== 'all') count++;
                        if (filters.time !== 'all') count++;
                        if (filters.tlds.size !== 3 || !filters.tlds.has('com')) count++;
                        if (filters.humbleMin) count++;
                        return count > 0 ? (
                            <span className="bg-white text-indigo-600 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                {count}
                            </span>
                        ) : null;
                    })()}
                </button>
            </div>
        </div>
    );
}
