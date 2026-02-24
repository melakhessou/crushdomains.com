'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Info, Check } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import clsx from 'clsx';

export const SUPPORTED_TLDS = ['com', 'net', 'io', 'org', 'co', 'ai', 'xyz'];

export interface FilterState {
    selectedTlds: string[];
    maxPrice: number | null;
    minBids: number;
    search: string;
    patternInput: string;
    noNumbers: boolean;
    noHyphens: boolean;
}

interface Props {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    totalMatches: number;
    totalAvailable: number;
    patternCount: number;
}

export function DynadotFilters({
    filters,
    onChange,
    totalMatches,
    totalAvailable,
    patternCount
}: Props) {
    const [localSearch, setLocalSearch] = useState(filters.search);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== filters.search) {
                onChange({ ...filters, search: localSearch });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [localSearch, filters, onChange]);

    // Update local search if filters.search changes externally (e.g. reset)
    useEffect(() => {
        setLocalSearch(filters.search);
    }, [filters.search]);

    const toggleTld = (tld: string) => {
        const next = filters.selectedTlds.includes(tld)
            ? filters.selectedTlds.filter(t => t !== tld)
            : [...filters.selectedTlds, tld];
        onChange({ ...filters, selectedTlds: next });
    };

    const clearTlds = () => {
        onChange({ ...filters, selectedTlds: [] });
    };

    return (
        <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 space-y-4">
            <div className="flex flex-wrap gap-6 items-start">
                {/* TLD Multi-select */}
                <div className="space-y-2 flex-1 min-w-[280px]">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter by TLDs</label>
                        {filters.selectedTlds.length > 0 && (
                            <button
                                onClick={clearTlds}
                                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wide"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {SUPPORTED_TLDS.map(tld => {
                            const isSelected = filters.selectedTlds.includes(tld);
                            return (
                                <button
                                    key={tld}
                                    onClick={() => toggleTld(tld)}
                                    className={clsx(
                                        'px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1',
                                        isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                    )}
                                >
                                    {isSelected && <Check className="w-3 h-3" />}
                                    .{tld}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Numeric Filters */}
                <div className="flex gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Max Price (USD)</label>
                        <input
                            type="number"
                            min={0}
                            placeholder="No limit"
                            value={filters.maxPrice ?? ''}
                            onChange={e => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
                            className="block w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Min Bids</label>
                        <input
                            type="number"
                            min={0}
                            value={filters.minBids || ''}
                            placeholder="0"
                            onChange={e => onChange({ ...filters, minBids: Number(e.target.value) || 0 })}
                            className="block w-28 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Filters</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onChange({ ...filters, noNumbers: !filters.noNumbers })}
                                className={clsx(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-wider",
                                    filters.noNumbers
                                        ? "bg-amber-100 text-amber-700 border-amber-200 shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                )}
                            >
                                No Numbers
                            </button>
                            <button
                                onClick={() => onChange({ ...filters, noHyphens: !filters.noHyphens })}
                                className={clsx(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all uppercase tracking-wider",
                                    filters.noHyphens
                                        ? "bg-amber-100 text-amber-700 border-amber-200 shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                )}
                            >
                                No Hyphens
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-6 items-start">
                {/* Search */}
                <div className="space-y-1 flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Search Domain</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="e.g. crypto, finance…"
                            value={localSearch}
                            onChange={e => setLocalSearch(e.target.value)}
                            className="block w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Domain Name Pattern */}
                <div className="space-y-1 flex-1 min-w-[280px]">
                    <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Domain Name Pattern</label>
                        <Tooltip content={
                            <div className="space-y-2 p-1 w-64">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    {[
                                        ['C', 'Consonant'],
                                        ['V', 'Vowel'],
                                        ['L', 'Any Letter'],
                                        ['N', 'Any Digit'],
                                        ['-', 'Hyphen'],
                                        ['*', 'Wildcard (*)'],
                                        ['A-K', 'Repeating Letters'],
                                        ['D-G', 'Repeating Digits'],
                                    ].map(([sym, desc]) => (
                                        <div key={sym} className="flex items-center gap-1.5">
                                            <code className="bg-slate-800 px-1 rounded text-indigo-400 font-bold text-[10px]">{sym}</code>
                                            <span className="text-slate-300 text-[10px]">{desc}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 border-t border-slate-700/50 pt-1.5 leading-tight">
                                    Separate patterns with spaces (logical OR). Matches only the domain name part.
                                </p>
                            </div>
                        }>
                            <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 transition-colors" />
                        </Tooltip>
                        {patternCount > 0 && (
                            <span className="ml-auto text-xs font-semibold text-indigo-600">
                                {patternCount} active
                            </span>
                        )}
                    </div>
                    <input
                        type="text"
                        placeholder="e.g. CVCVCV LLLL NNN"
                        value={filters.patternInput}
                        onChange={e => onChange({ ...filters, patternInput: e.target.value })}
                        maxLength={300}
                        className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 placeholder:font-sans focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Results match label */}
            <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-slate-400 italic">
                    {totalMatches} domains match your criteria (out of {totalAvailable} available)
                </span>
            </div>
        </div>
    );
}
