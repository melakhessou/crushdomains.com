'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Gavel, Clock, Globe } from 'lucide-react';
import clsx from 'clsx';
import { TableAuctions, type Lang } from '@/components/TableAuctions';
import type { Auction } from '@/app/api/auctions/route';

// ─── I18n ─────────────────────────────────────────────────────────────────────

const PAGE_DICT = {
    en: {
        title: 'Expired Auctions',
        subtitle: 'Live expired-domain auctions from Dynadot, updated every hour.',
        refresh: 'Refresh',
        refreshing: 'Refreshing…',
        nextRefresh: 'Next refresh in',
        cached: '(cached)',
        live: 'Live',
        error: 'Error loading auctions.',
        missingKey: 'Dynadot API key is not configured.',
        addKey: 'Add DYNA_DOT_API_KEY to Vercel → Settings → Environment Variables.',
        fetched: 'Fetched',
        auctions: 'auctions',
    },
    fr: {
        title: 'Enchères Expirées',
        subtitle: 'Enchères de domaines expirés en direct depuis Dynadot, mises à jour toutes les heures.',
        refresh: 'Actualiser',
        refreshing: 'Chargement…',
        nextRefresh: 'Prochain rafraîchissement dans',
        cached: '(cache)',
        live: 'En direct',
        error: 'Erreur lors du chargement.',
        missingKey: "Clé API Dynadot non configurée.",
        addKey: 'Ajoutez DYNA_DOT_API_KEY dans Vercel → Settings → Environment Variables.',
        fetched: 'Récupéré',
        auctions: 'enchères',
    },
    ar: {
        title: 'مزادات المنتهية',
        subtitle: 'مزادات النطاقات المنتهية مباشرة من Dynadot، تُحدَّث كل ساعة.',
        refresh: 'تحديث',
        refreshing: 'جارٍ التحديث…',
        nextRefresh: 'التحديث القادم خلال',
        cached: '(مخزن مؤقت)',
        live: 'مباشر',
        error: 'خطأ في تحميل المزادات.',
        missingKey: 'مفتاح Dynadot API غير مُهيَّأ.',
        addKey: 'أضف DYNA_DOT_API_KEY في Vercel → Settings → Environment Variables.',
        fetched: 'تم جلب',
        auctions: 'مزادات',
    },
} as const;

const LANGS: { code: Lang; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'AR' },
];

const REFRESH_INTERVAL = 5 * 60; // 5 min in seconds

// ─── Component ────────────────────────────────────────────────────────────────

export function AuctionsPageClient() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMissingKey, setIsMissingKey] = useState(false);
    const [fetchedAt, setFetchedAt] = useState<string | null>(null);
    const [isCached, setIsCached] = useState(false);
    const [lang, setLang] = useState<Lang>('en');
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const t = PAGE_DICT[lang];

    const fetchAuctions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setCountdown(REFRESH_INTERVAL);

        try {
            const res = await fetch('/api/auctions', { cache: 'no-store' });
            const data = await res.json();

            if (!res.ok) {
                // Check for missing API key
                if (data.error?.includes('DYNA_DOT_API_KEY')) {
                    setIsMissingKey(true);
                } else {
                    setError(data.error ?? t.error);
                }
                setAuctions([]);
            } else {
                setAuctions(data.auctions ?? []);
                setFetchedAt(data.fetchedAt ?? new Date().toISOString());
                setIsCached(data.cached ?? false);
                setIsMissingKey(false);
            }
        } catch {
            setError(t.error);
        } finally {
            setIsLoading(false);
        }
    }, [t.error]);

    // Initial load
    useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

    // Auto-refresh every 5 min
    useEffect(() => {
        const timer = setInterval(fetchAuctions, REFRESH_INTERVAL * 1000);
        return () => clearInterval(timer);
    }, [fetchAuctions]);

    // Countdown ticker
    useEffect(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL : c - 1));
        }, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [fetchedAt]);

    const mins = String(Math.floor(countdown / 60)).padStart(2, '0');
    const secs = String(countdown % 60).padStart(2, '0');
    const fetchedLabel = fetchedAt
        ? new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <div
            className={clsx(
                'min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 p-6 md:p-10',
                lang === 'ar' && 'text-right'
            )}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ── Header ── */}
                <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-3 flex-wrap">
                            <Gavel className="w-8 h-8 text-indigo-500 flex-shrink-0" />
                            {t.title}
                        </h1>
                        <p className="text-base text-slate-500 font-medium max-w-xl">{t.subtitle}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Lang switcher */}
                        <div className="flex items-center gap-1 bg-white/70 border border-slate-200 rounded-xl p-1 shadow-sm">
                            <Globe className="w-4 h-4 text-slate-400 mx-1" />
                            {LANGS.map(({ code, label }) => (
                                <button
                                    key={code}
                                    onClick={() => setLang(code)}
                                    className={clsx(
                                        'px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-150',
                                        lang === code
                                            ? 'bg-indigo-600 text-white shadow'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Refresh button */}
                        <button
                            onClick={fetchAuctions}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all duration-150 active:scale-95"
                        >
                            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
                            {isLoading ? t.refreshing : t.refresh}
                        </button>
                    </div>
                </header>

                {/* ── Status bar ── */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {/* Live indicator */}
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

                    {!isLoading && !error && auctions.length > 0 && (
                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
                            {auctions.length} {t.auctions}
                        </span>
                    )}
                </div>

                {/* ── Missing API key banner ── */}
                {isMissingKey && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800">
                        <p className="font-bold text-sm">⚠️ {t.missingKey}</p>
                        <p className="text-xs mt-1 text-amber-700">{t.addKey}</p>
                        <code className="mt-2 block text-xs bg-amber-100 rounded-lg px-3 py-2 font-mono">
                            DYNA_DOT_API_KEY=your_key_here
                        </code>
                    </div>
                )}

                {/* ── Error banner ── */}
                {error && !isMissingKey && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* ── Table ── */}
                {!isMissingKey && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
                        <TableAuctions auctions={auctions} isLoading={isLoading} lang={lang} />
                    </div>
                )}
            </div>
        </div>
    );
}
