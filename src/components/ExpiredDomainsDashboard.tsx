'use client';

import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { FileUpload } from '@/components/FileUpload';
import { DomainTable, Domain } from '@/components/DomainTable';
import { Search, Download, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
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
    const [allDomains, setAllDomains] = useState<Domain[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [tldFilter, setTldFilter] = useState('');
    const [minLen, setMinLen] = useState<number | ''>('');
    const [maxLen, setMaxLen] = useState<number | ''>('');

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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [copied, setCopied] = useState(false);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, tldFilter, minLen, maxLen, startsWith, contains, endsWith, regexPattern, patternFilter, onlyNumbers, onlyCharacters, noHyphens]);

    const handleFileUpload = (file: File) => {
        setIsParsing(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const findValue = (row: any, ...targets: string[]) => {
                    const keys = Object.keys(row);
                    for (const target of targets) {
                        const normalizedTarget = target.toLowerCase().trim();
                        const key = keys.find(k => k.toLowerCase().trim() === normalizedTarget);
                        if (key) return row[key];
                    }
                    return '';
                };

                const parsed: Domain[] = results.data.map((row: any) => {
                    const domainName = findValue(row, 'Domain', 'domain', 'Domain Name');
                    if (!domainName) return null;
                    const parts = domainName.split('.');
                    const tld = parts.length > 1 ? parts.pop() : '';
                    const name = parts.join('.');

                    return {
                        domainName: domainName,
                        tld: tld || '',
                        length: name.length,
                        deleteDate: findValue(row, 'Join By Date (ET)', 'PreReleaseDate', 'delete_date', 'Date'),
                    };
                }).filter((d: any): d is Domain => d !== null);

                setAllDomains(parsed);
                setLastUpdated(new Date().toLocaleTimeString());
                setIsParsing(false);
            },
            error: (error) => {
                console.error('Error parsing CSV:', error);
                setIsParsing(false);
                alert('Failed to parse CSV file.');
            }
        });
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
            if (onlyNumbers && !/^\d+$/.test(namePart)) return false;
            if (onlyCharacters && !/^[a-z]+$/.test(namePart)) return false;

            return true;
        });
    }, [allDomains, searchTerm, regexPattern, patternFilter, tldFilter, minLen, maxLen, startsWith, contains, endsWith, onlyNumbers, onlyCharacters, noHyphens]);

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
        const csv = Papa.unparse(filteredDomains);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 p-6 md:p-10 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-indigo-500" />
                            {nicheTitle || 'Expired Domains'}
                        </h1>
                        <p className="text-lg text-slate-500 font-medium">{nicheTitle ? `${nicheTitle} Niche Dashboard` : 'Domain Investor Dashboard'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {lastUpdated && (
                            <div className="px-4 py-2 bg-white/60 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-600 border border-indigo-100 shadow-sm">
                                Data Updated: {lastUpdated}
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
                    <aside className="space-y-6">
                        <div className="p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 space-y-6 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">Data Source</label>
                                <FileUpload onFileSelect={handleFileUpload} />
                                {isParsing && <p className="text-xs font-medium text-indigo-500 mt-2 animate-pulse">Parsing CSV...</p>}
                            </div>
                            <div className="h-px bg-slate-200/50" />
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800">Filters</h3>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{allDomains.length} total</span>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Keyword Search</label>
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search domains..."
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {/* ... existing patterns, regex, TLD, length filters ... */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                        Pattern
                                        <AlertCircle className="w-3 h-3 text-slate-400 cursor-help" />
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. CVCV, NNN"
                                        className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm font-mono uppercase"
                                        value={patternFilter}
                                        onChange={(e) => setPatternFilter(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Extension</label>
                                    <select
                                        className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-sm appearance-none"
                                        value={tldFilter}
                                        onChange={(e) => setTldFilter(e.target.value)}
                                    >
                                        <option value="">All Extensions</option>
                                        {uniqueTLDs.map(tld => <option key={tld} value={tld}>.{tld}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" placeholder="Min" className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm" value={minLen} onChange={(e) => setMinLen(e.target.value ? Number(e.target.value) : '')} />
                                    <input type="number" placeholder="Max" className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm" value={maxLen} onChange={(e) => setMaxLen(e.target.value ? Number(e.target.value) : '')} />
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main>
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden flex flex-col h-full min-h-[800px]">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-lg font-bold text-slate-800">Results</h2>
                                    <span className="text-sm font-medium text-slate-400">({totalItems})</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleCopy} disabled={totalItems === 0} className={clsx("flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border", copied ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-slate-600 border-slate-200")}>
                                        <Copy size={16} /> {copied ? 'Copied' : 'Copy'}
                                    </button>
                                    <button onClick={handleExport} disabled={totalItems === 0} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg">
                                        <Download size={16} /> Export
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <DomainTable domains={paginatedDomains} />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
