'use client';

import { useState, useMemo, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DomainTable, NamejetDomain } from '@/components/DomainTable';
import { parseNamejetCsv, NamejetSource } from '@/lib/namejet-parser';
import { Search, Download, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Copy, Filter, SlidersHorizontal, X, Check } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';
import { Tooltip } from './ui/Tooltip';
import clsx from 'clsx';

// Helper to convert CVCV pattern to Regex
function convertPatternToRegex(pattern: string): RegExp | null {
    if (!pattern) return null;

    let regexStr = '^';
    const chars = pattern.toUpperCase().split('');

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const nextChar = chars[i + 1];
        const isStar = nextChar === '*';
        const quantifier = isStar ? '+' : '';

        if (isStar) i++; // Skip the star in next iteration

        switch (char) {
            case 'C': // Consonant
                regexStr += `[bcdfghjklmnpqrstvwxyz]${quantifier}`;
                break;
            case 'V': // Vowel
                regexStr += `[aeiou]${quantifier}`;
                break;
            case 'N': // Number
                regexStr += `[0-9]${quantifier}`;
                break;
            case 'L': // Letter
                regexStr += `[a-z]${quantifier}`;
                break;
            case '?': // Wildcard
                regexStr += `.${quantifier}`;
                break;
            case '-': // Literal hyphen
                regexStr += `\\-${quantifier}`; // Escaped for regex
                break;
            default:
                // Treat as literal character if not a special token
                regexStr += `[${char.toLowerCase()}]${quantifier}`;
                break;
        }
    }

    regexStr += '$';

    try {
        return new RegExp(regexStr, 'i');
    } catch (e) {
        return null;
    }
}

interface DashboardProps {
    initialSearch?: string;
    nicheTitle?: string;
}

export function ExpiredDomainsDashboard({ initialSearch = '', nicheTitle }: DashboardProps) {
    const [allDomains, setAllDomains] = useState<NamejetDomain[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [tldFilter, setTldFilter] = useState('');
    const [minLen, setMinLen] = useState<number | ''>('');
    const [maxLen, setMaxLen] = useState<number | ''>('');
    const [sourceFilter, setSourceFilter] = useState<NamejetSource | 'all'>('all');

    // Advanced Filters - Allowlist
    const [startsWith, setStartsWith] = useState('');
    const [contains, setContains] = useState('');
    const [endsWith, setEndsWith] = useState('');

    // Advanced Filters - Patterns
    const [regexPattern, setRegexPattern] = useState('');
    const [patternFilter, setPatternFilter] = useState('');

    // Advanced Filters - Settings
    const [onlyNumbers, setOnlyNumbers] = useState(false);
    const [onlyCharacters, setOnlyCharacters] = useState(false);
    const [noHyphens, setNoHyphens] = useState(false);
    const [noNumbers, setNoNumbers] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Layout state
    const [showFilters, setShowFilters] = useState(false);
    const [copied, setCopied] = useState(false);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, tldFilter, minLen, maxLen, startsWith, contains, endsWith, regexPattern, patternFilter, onlyNumbers, onlyCharacters, noHyphens, noNumbers]);

    const handleFileUpload = (file: File) => {
        setIsParsing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            try {
                const parsed = parseNamejetCsv(content);
                setAllDomains(parsed);
                setLastUpdated(new Date().toLocaleTimeString());
            } catch (error) {
                console.error('Error parsing NameJet CSV:', error);
                alert('Failed to parse CSV file. Please ensure it is a valid NameJet format.');
            } finally {
                setIsParsing(false);
            }
        };
        reader.onerror = () => {
            setIsParsing(false);
            alert('Error reading file.');
        };
        reader.readAsText(file);
    };

    const filteredDomains = useMemo(() => {
        const patternRegex = convertPatternToRegex(patternFilter);

        return allDomains.filter(d => {
            const namePart = d.domainName.split('.')[0].toLowerCase();

            if (searchTerm && !d.domainName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (regexPattern) {
                try {
                    const regex = new RegExp(regexPattern, 'i');
                    if (!regex.test(d.domainName)) return false;
                } catch (e) { }
            }
            if (patternRegex && !patternRegex.test(namePart)) return false;
            if (tldFilter) {
                const cleanFilter = tldFilter.replace(/^\./, '').toLowerCase();
                if (d.tld.toLowerCase() !== cleanFilter) return false;
            }
            if (minLen !== '' && d.length < Number(minLen)) return false;
            if (maxLen !== '' && d.length > Number(maxLen)) return false;
            if (startsWith && !namePart.startsWith(startsWith.toLowerCase())) return false;
            if (contains && !namePart.includes(contains.toLowerCase())) return false;
            if (endsWith && !namePart.endsWith(endsWith.toLowerCase())) return false;
            if (noHyphens && namePart.includes('-')) return false;
            if (noNumbers && /\d/.test(namePart)) return false;
            if (onlyNumbers && !/^\d+$/.test(namePart)) return false;
            if (onlyCharacters && !/^[a-z]+$/.test(namePart)) return false;

            return true;
        });
    }, [allDomains, searchTerm, regexPattern, patternFilter, tldFilter, minLen, maxLen, startsWith, contains, endsWith, onlyNumbers, onlyCharacters, noHyphens, noNumbers]);

    const paginatedDomains = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredDomains.slice(start, start + itemsPerPage);
    }, [filteredDomains, currentPage, itemsPerPage]);

    const uniqueTLDs = useMemo(() => {
        const tlds = new Set(allDomains.map(d => d.tld).filter(Boolean));
        return Array.from(tlds).sort();
    }, [allDomains]);

    const totalItems = filteredDomains.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (totalItems === 0) ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min((currentPage - 1) * itemsPerPage + itemsPerPage, totalItems);

    const handleExport = () => {
        if (filteredDomains.length === 0) return;
        // Simple CSV export
        const headers = ['Domain', 'Type', 'Bid', 'Closing Date'];
        const rows = filteredDomains.map(d => [
            d.domainName,
            d.source,
            d.currentBid || '',
            d.closingDate ? d.closingDate.toISOString() : ''
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `crush_domains_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopy = () => {
        if (paginatedDomains.length === 0) return;
        const text = paginatedDomains.map(d => d.domainName).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 p-4 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="text-center space-y-3 relative">
                    <PageTitle className="flex items-center justify-center gap-3">
                        <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-indigo-500 flex-shrink-0" />
                        {nicheTitle || 'Filter Expiring / Deleting Domains'}
                    </PageTitle>
                    <p className="text-lg text-slate-500 font-normal mx-auto max-w-2xl leading-relaxed">
                        {nicheTitle ? `${nicheTitle} Niche Dashboard` : 'Premium Domain Investor Dashboard'}
                    </p>
                    {lastUpdated && (
                        <div className="pt-2 flex justify-center">
                            <div className="px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-xs font-bold text-indigo-600 border border-indigo-100 shadow-sm uppercase tracking-wider">
                                Data Updated: {lastUpdated}
                            </div>
                        </div>
                    )}
                </header>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                    {/* Filter toggle */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 text-base font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                            {allDomains.length > 0 && (
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {allDomains.length} total
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Filter section */}
                    {showFilters && (
                        <div className="px-5 py-6 bg-slate-50/50 border-b border-slate-100 space-y-6">
                            <div className="flex flex-wrap gap-8 items-start">
                                {/* Left: Data Source & Keyword Search */}
                                <div className="space-y-4 flex-1 min-w-[280px]">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Source</label>
                                        <FileUpload onFileSelect={handleFileUpload} />
                                        {isParsing && <p className="text-xs font-medium text-indigo-500 mt-2 animate-pulse">Parsing CSV...</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Keyword Search</label>
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Search domains..."
                                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Pattern & Settings */}
                                <div className="space-y-6 flex-1 min-w-[280px]">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pattern</label>
                                            <Tooltip content={
                                                <div className="space-y-2 p-1 w-64">
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                        {[
                                                            ['C', 'Consonant'],
                                                            ['V', 'Vowel'],
                                                            ['L', 'Any Letter'],
                                                            ['N', 'Any Digit'],
                                                            ['-', 'Hyphen'],
                                                            ['?', 'Wildcard (?)'],
                                                            ['*', 'Wildcard (+)'],
                                                        ].map(([sym, desc]) => (
                                                            <div key={sym} className="flex items-center gap-1.5">
                                                                <code className="bg-slate-800 px-1 rounded text-indigo-400 font-bold text-xs">{sym}</code>
                                                                <span className="text-slate-300 text-xs">{desc}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            }>
                                                <AlertCircle size={14} className="text-slate-400 cursor-help hover:text-indigo-500 transition-colors" />
                                            </Tooltip>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="e.g. CVCV, NNN"
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={patternFilter}
                                            onChange={(e) => setPatternFilter(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">SETTINGS</label>
                                        <div className="flex flex-col gap-2 pt-1">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={noHyphens}
                                                        onChange={(e) => setNoHyphens(e.target.checked)}
                                                        className="peer appearance-none w-4 h-4 border border-slate-300 rounded bg-white checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                                                    />
                                                    <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                                </div>
                                                <span className="text-sm text-slate-600 group-hover:text-indigo-600 transition-colors">No Hyphens</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={noNumbers}
                                                        onChange={(e) => setNoNumbers(e.target.checked)}
                                                        className="peer appearance-none w-4 h-4 border border-slate-300 rounded bg-white checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                                                    />
                                                    <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                                </div>
                                                <span className="text-sm text-slate-600 group-hover:text-indigo-600 transition-colors">No Numbers</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Extension & Length */}
                                <div className="space-y-4 flex-1 min-w-[240px]">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Extension</label>
                                        <select
                                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={tldFilter}
                                            onChange={(e) => setTldFilter(e.target.value)}
                                        >
                                            <option value="">All Extensions</option>
                                            {uniqueTLDs.map(tld => <option key={tld} value={tld}>.{tld}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Length</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="number" placeholder="Min" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={minLen} onChange={(e) => setMinLen(e.target.value ? Number(e.target.value) : '')} />
                                            <input type="number" placeholder="Max" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={maxLen} onChange={(e) => setMaxLen(e.target.value ? Number(e.target.value) : '')} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden flex flex-col h-full min-h-[600px] sm:min-h-[800px]">
                        <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center bg-white/50 gap-3">
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-xl font-semibold text-slate-800">Results</h2>
                                <span className="text-base font-normal text-slate-400">({totalItems})</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
                                <button onClick={handleCopy} disabled={totalItems === 0} className={clsx("flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border", copied ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-slate-600 border-slate-200")}>
                                    <Copy size={16} /> {copied ? 'Copied' : 'Copy'}
                                </button>
                                <button onClick={handleExport} disabled={totalItems === 0} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-lg">
                                    <Download size={16} /> Export
                                </button>
                            </div>
                        </div>


                        {/* Pagination Toolbar */}
                        <div className="px-4 py-2 sm:py-3 border-b border-slate-100 bg-white/50 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <span>Rows:</span>
                                <select
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={200}>200</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <span>
                                    {startItem}-{endItem} <span className="hidden xs:inline">of {totalItems}</span>
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <DomainTable domains={paginatedDomains} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
