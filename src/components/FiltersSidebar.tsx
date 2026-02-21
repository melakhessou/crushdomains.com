'use client';

import { useEffect, useRef } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BidsFilter = 'all' | 'low' | 'mid' | 'hot';
export type TimeFilter = 'all' | '24h' | '48h';

export interface Filters {
    priceMax: number;
    bids: BidsFilter;
    time: TimeFilter;
    tlds: Set<string>;
    humbleMin: boolean; // toggle: show only HumbleWorth ≥ 70 (client-only)
}

export const DEFAULT_FILTERS: Filters = {
    priceMax: 100,
    bids: 'all',
    time: 'all',
    tlds: new Set(['com', 'net', 'io']),
    humbleMin: false,
};

// ─── I18n ─────────────────────────────────────────────────────────────────────

const DICT = {
    en: {
        title: 'Filters',
        priceMax: 'Max Price',
        competition: 'Competition',
        bidsAll: 'All',
        bidsLow: 'Low (<5 bids)',
        bidsMid: 'Moderate (5–20)',
        bidsHot: '🔥 Hot (>20)',
        timeLeft: 'Time Left',
        timeAll: 'All',
        time24: 'Under 24h',
        time48: 'Under 48h',
        tldFilter: 'Top TLDs',
        humble: 'HumbleWorth ≥70',
        reset: 'Reset',
    },
    fr: {
        title: 'Filtres',
        priceMax: 'Prix max',
        competition: 'Compétition',
        bidsAll: 'Tous',
        bidsLow: 'Faible (<5)',
        bidsMid: 'Modéré (5–20)',
        bidsHot: '🔥 Populaire (>20)',
        timeLeft: 'Temps restant',
        timeAll: 'Tous',
        time24: 'Moins de 24h',
        time48: 'Moins de 48h',
        tldFilter: 'Meilleurs TLD',
        humble: 'HumbleWorth ≥70',
        reset: 'Réinitialiser',
    },
    ar: {
        title: 'الفلاتر',
        priceMax: 'الحد الأقصى للسعر',
        competition: 'المنافسة',
        bidsAll: 'الكل',
        bidsLow: 'منخفض (<5)',
        bidsMid: 'متوسط (5–20)',
        bidsHot: '🔥 ساخن (>20)',
        timeLeft: 'الوقت المتبقي',
        timeAll: 'الكل',
        time24: 'أقل من 24 ساعة',
        time48: 'أقل من 48 ساعة',
        tldFilter: 'أفضل TLD',
        humble: 'HumbleWorth ≥70',
        reset: 'إعادة تعيين',
    },
} as const;

export type Lang = keyof typeof DICT;

const TOP_TLDS = ['com', 'net', 'io', 'org', 'co'];

// ─── TLD badge colour ─────────────────────────────────────────────────────────

function tldColor(tld: string) {
    if (tld === 'com') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (tld === 'net') return 'bg-amber-100  text-amber-700  border-amber-200';
    if (tld === 'io') return 'bg-blue-100   text-blue-700   border-blue-200';
    if (tld === 'org') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100  text-slate-600  border-slate-200';
}

// ─── Inner Panel (shared by desktop sidebar & mobile sheet) ───────────────────

interface PanelProps {
    filters: Filters;
    onChange: (f: Filters) => void;
    lang: Lang;
    onClose?: () => void;
}

function FiltersPanel({ filters, onChange, lang, onClose }: PanelProps) {
    const t = DICT[lang];

    const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

    const toggleTld = (tld: string) => {
        const next = new Set(filters.tlds);
        next.has(tld) ? next.delete(tld) : next.add(tld);
        set({ tlds: next });
    };

    const reset = () => onChange({ ...DEFAULT_FILTERS, tlds: new Set(DEFAULT_FILTERS.tlds) });

    return (
        <div className="flex flex-col gap-5 p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                    {t.title}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={reset}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                    >
                        {t.reset}
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-1">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Price slider */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {t.priceMax}: <span className="text-indigo-600 font-bold">${filters.priceMax}</span>
                </label>
                <input
                    type="range"
                    min={10}
                    max={500}
                    step={10}
                    value={filters.priceMax}
                    onChange={(e) => set({ priceMax: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>$10</span><span>$500</span>
                </div>
            </div>

            {/* Bids radio */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t.competition}</p>
                {([
                    ['all', t.bidsAll],
                    ['low', t.bidsLow],
                    ['mid', t.bidsMid],
                    ['hot', t.bidsHot],
                ] as [BidsFilter, string][]).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="bids"
                            value={val}
                            checked={filters.bids === val}
                            onChange={() => set({ bids: val })}
                            className="accent-indigo-600"
                        />
                        <span className={clsx('text-sm transition-colors', filters.bids === val ? 'text-indigo-700 font-semibold' : 'text-slate-600 group-hover:text-slate-800')}>
                            {label}
                        </span>
                    </label>
                ))}
            </div>

            {/* Time radio */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t.timeLeft}</p>
                {([
                    ['all', t.timeAll],
                    ['24h', t.time24],
                    ['48h', t.time48],
                ] as [TimeFilter, string][]).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="time"
                            value={val}
                            checked={filters.time === val}
                            onChange={() => set({ time: val })}
                            className="accent-indigo-600"
                        />
                        <span className={clsx('text-sm transition-colors', filters.time === val ? 'text-indigo-700 font-semibold' : 'text-slate-600 group-hover:text-slate-800')}>
                            {label}
                        </span>
                    </label>
                ))}
            </div>

            {/* TLD checkboxes */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t.tldFilter}</p>
                <div className="flex flex-wrap gap-2">
                    {TOP_TLDS.map((tld) => {
                        const active = filters.tlds.has(tld);
                        return (
                            <button
                                key={tld}
                                onClick={() => toggleTld(tld)}
                                className={clsx(
                                    'px-2.5 py-1 rounded-lg text-xs font-bold border transition-all',
                                    active ? tldColor(tld) : 'bg-white text-slate-400 border-slate-200 opacity-60'
                                )}
                            >
                                .{tld}
                            </button>
                        );
                    })}
                </div>
                <p className="text-[10px] text-slate-400">
                    Leave all unchecked to show all TLDs.
                </p>
            </div>

            {/* HumbleWorth toggle */}
            <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold text-slate-700">{t.humble}</span>
                <div
                    onClick={() => set({ humbleMin: !filters.humbleMin })}
                    className={clsx(
                        'relative inline-flex w-10 h-5 rounded-full transition-colors',
                        filters.humbleMin ? 'bg-indigo-600' : 'bg-slate-200'
                    )}
                >
                    <span className={clsx(
                        'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                        filters.humbleMin && 'translate-x-5'
                    )} />
                </div>
            </label>
        </div>
    );
}

// ─── Main export: Desktop Sidebar + Mobile Sheet ──────────────────────────────

interface FiltersSidebarProps extends PanelProps {
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export function FiltersSidebar({ mobileOpen, onMobileClose, ...rest }: FiltersSidebarProps) {
    const sheetRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!mobileOpen) return;
        const handler = (e: MouseEvent) => {
            if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
                onMobileClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [mobileOpen, onMobileClose]);

    return (
        <>
            {/* ── Desktop sticky sidebar ── */}
            <aside className="hidden lg:flex flex-col w-64 flex-shrink-0">
                <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-lg overflow-hidden">
                    <FiltersPanel {...rest} />
                </div>
            </aside>

            {/* ── Mobile bottom sheet backdrop ── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" />
            )}

            {/* ── Mobile bottom sheet ── */}
            <div
                ref={sheetRef}
                className={clsx(
                    'fixed bottom-0 inset-x-0 z-50 lg:hidden rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto',
                    mobileOpen ? 'translate-y-0' : 'translate-y-full'
                )}
            >
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3" />
                <FiltersPanel {...rest} onClose={onMobileClose} />
            </div>
        </>
    );
}
