'use client';

import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { Loader2, Upload, AlertCircle, FileDown, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';
import { clsx } from 'clsx';


// --- Types ---

interface AppraisalRow {
    domain: string;
    auction: number;
    market: number;
    broker: number;
}

type SortField = 'broker' | 'market' | 'auction' | 'domain';
type SortDirection = 'asc' | 'desc';

// --- Components ---

export default function BulkAppraisalPage() {
    // State
    const [rawInput, setRawInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<AppraisalRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ processed: number, total: number } | null>(null);

    // Sorting State
    const [sortField, setSortField] = useState<SortField>('broker');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // --- Actions ---

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc'); // Default to desc for numbers usually
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            complete: (results) => {
                // Assume first column has domains
                const domains: string[] = [];
                results.data.forEach((row: any) => {
                    const domain = Array.isArray(row) ? row[0] : row['domain'] || row['Domain'];
                    if (domain && typeof domain === 'string') {
                        domains.push(domain);
                    }
                });
                setRawInput(domains.join('\n'));
            },
            header: false // Try generic first column parsing
        });
    };

    const processDomains = async () => {
        setError(null);
        setIsLoading(true);
        setResults([]);

        // 1. Process Input
        const lines = rawInput
            .split(/[\n,]/) // Split by newline or comma
            .map(s => s.trim().toLowerCase())
            .filter(s => s.length > 0 && s.includes('.')); // Basic validation

        // Dedup and Limit
        const uniqueDomains = Array.from(new Set(lines));
        const limitedDomains = uniqueDomains.slice(0, 200);

        if (limitedDomains.length === 0) {
            setError('Please enter at least one valid domain.');
            setIsLoading(false);
            return;
        }

        setProgress({ processed: 0, total: limitedDomains.length });

        try {
            const response = await fetch('/api/bulk-appraisal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domains: limitedDomains })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to process domains');
            }

            const data = await response.json();
            setResults(data.results);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            setProgress(null);
        }
    };

    const exportCSV = () => {
        if (results.length === 0) return;

        const csv = Papa.unparse(results.map(r => ({
            Domain: r.domain,
            Auction: r.auction,
            Market: r.market,
            Broker: r.broker
        })));

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bulk_appraisal_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Derived State
    const sortedResults = useMemo(() => {
        return [...results].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            // Numbers
            return sortDirection === 'asc'
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        });
    }, [results, sortField, sortDirection]);

    const paginatedResults = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedResults.slice(start, start + itemsPerPage);
    }, [sortedResults, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
    const startItem = (sortedResults.length === 0) ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min((currentPage - 1) * itemsPerPage + itemsPerPage, sortedResults.length);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    const handleReset = () => {
        setResults([]);
        setRawInput('');
        setError(null);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Input View */}
                {results.length === 0 && (
                    <>
                        <header className="text-center mb-12 space-y-3 relative">
                            <PageTitle className="flex items-center justify-center gap-3">
                                <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-indigo-500 flex-shrink-0" />
                                Bulk Valuation
                            </PageTitle>
                            <p className="text-lg text-slate-500 font-normal mx-auto max-w-2xl leading-relaxed">
                                Analyze up to 200 domains at once using Crushdomains Valuation.
                            </p>
                            {/* Loading State in Header if processing but no results yet */}
                            {isLoading && (
                                <div className="pt-2 flex justify-center">
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </span>
                                </div>
                            )}
                        </header>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Enter domains (one per line)
                                </label>
                                <textarea
                                    value={rawInput}
                                    onChange={(e) => setRawInput(e.target.value)}
                                    disabled={isLoading}
                                    placeholder="example.com&#10;test.com&#10;awesome.io"
                                    className="w-full h-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="csv-upload"
                                        disabled={isLoading}
                                    />
                                    <label
                                        htmlFor="csv-upload"
                                        className={clsx(
                                            "flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-200 transition-colors",
                                            isLoading && "pointer-events-none opacity-50"
                                        )}
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload CSV
                                    </label>
                                    <p className="text-xs text-slate-400 mt-1 pl-1">
                                        First column used as domain list
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right text-sm text-slate-500">
                                        {rawInput.split('\n').filter(l => l.trim()).length} / 200
                                    </div>
                                    <button
                                        onClick={processDomains}
                                        disabled={isLoading || !rawInput.trim()}
                                        className={clsx(
                                            "px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-base shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2",
                                            (isLoading || !rawInput.trim()) && "opacity-50 cursor-not-allowed shadow-none"
                                        )}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            "Analyze Domains"
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Results View */}
                {results.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Results Header */}
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    {/* Simple Stack Icon or similar */}
                                    {/* Using a placeholder SVG or Lucide icon */}
                                    <div className="w-6 h-6 text-amber-600 flex items-center justify-center font-bold">
                                        ≣
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">Bulk Valuation</h2>
                                    <p className="text-base text-slate-500 font-normal">{results.length} domains analyzed</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={exportCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <FileDown className="w-4 h-4" />
                                    CSV
                                </button>
                                <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-base font-semibold flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    Ready
                                </span>
                            </div>
                        </div>


                        {/* Pagination Toolbar */}
                        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-base text-slate-500">

                            <div className="flex items-center gap-2">
                                <span>Rows per page:</span>
                                <select
                                    className="bg-white border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                                    {startItem}-{endItem} of {sortedResults.length}
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

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-base border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        {[
                                            { id: 'domain', label: 'DOMAIN' },
                                            { id: 'auction', label: 'AUCTION' },
                                            { id: 'market', label: 'MARKET' },
                                            { id: 'broker', label: 'BROKER' },
                                        ].map((col) => (
                                            <th
                                                key={col.id}
                                                onClick={() => handleSort(col.id as SortField)}
                                                className={clsx(
                                                    "p-4 text-xs font-semibold text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors select-none tracking-widest",
                                                    col.id !== 'domain' && "text-right"
                                                )}
                                            >
                                                <div className={clsx("flex items-center gap-2", col.id !== 'domain' && "justify-end")}>
                                                    {col.label}
                                                    {sortField === col.id ? (
                                                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />
                                                    ) : (
                                                        <ArrowUpDown className="w-3 h-3 text-slate-300" />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedResults.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-4 font-mono font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-lg">
                                                {row.domain}
                                            </td>
                                            <td className="p-4 text-slate-400 font-mono text-base text-right">{formatCurrency(row.auction)}</td>
                                            <td className="p-4 text-slate-600 font-mono text-base text-right">{formatCurrency(row.market)}</td>
                                            <td className="p-4 text-slate-900 font-mono font-bold text-base text-right">{formatCurrency(row.broker)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
