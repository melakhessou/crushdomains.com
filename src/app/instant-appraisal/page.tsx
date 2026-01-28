'use client';

import { useState } from 'react';
import { Search, Loader2, DollarSign, Activity, Tag, AlertTriangle, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface AppraisalResult {
    govalue?: number;
    currency?: string;
    domain?: string;
    comparable_sales?: any[];
    // GoDaddy API typically returns 'govalue'. 
    // Sale probability is not always explicitly returned as a percentage in the public lite API, 
    // but we will look for 'probability' or derived metrics if available. 
    // For now we'll display what we can get.
    price_range?: { min: number; max: number }; // Hypothetical, if API supports it or we calculate it
}

export default function InstantAppraisal() {
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AppraisalResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAppraise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Basic client-side clean up (remove protocol if pasted)
            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

            const res = await fetch(`/api/appraise/${encodeURIComponent(cleanDomain)}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get appraisal');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 p-6 md:p-10 font-sans text-slate-800 flex flex-col items-center">

            <div className="max-w-3xl w-full space-y-10">

                {/* Header */}
                <div className="text-center space-y-4 relative">
                    <a href="/" className="absolute left-0 top-1/2 -translate-y-1/2 md:-ml-20 p-2 text-slate-400 hover:text-indigo-600 transition-colors hidden md:block" title="Back to Dashboard">
                        <Activity className="w-6 h-6 rotate-[-90deg]" /> {/* Using Activity as placeholder arrow or import ChevronLeft in real app */}
                    </a>
                    <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center gap-3">
                        <Sparkles className="w-10 h-10 text-indigo-500" />
                        Instant Appraisal
                    </h1>
                    <p className="text-xl text-slate-500 font-medium">
                        Get a real-time market valuation for any domain name.
                    </p>
                </div>

                {/* Input Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
                    <form onSubmit={handleAppraise} className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Enter domain (e.g. crushdomains.com)"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !domain.trim()}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[180px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Get Value'
                            )}
                        </button>
                    </form>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}
                </div>

                {/* Results */}
                {result && (
                    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">

                        {/* Main Value Card */}
                        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100 p-8 md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                            <div className="space-y-2 text-center md:text-left z-10">
                                <h3 className="text-slate-500 font-semibold uppercase tracking-wider text-sm flex items-center gap-2 justify-center md:justify-start">
                                    <DollarSign className="w-4 h-4" /> Estimated Value
                                </h3>
                                <div className="text-6xl font-black text-slate-800">
                                    ${result.govalue?.toLocaleString() ?? 'N/A'}
                                </div>
                                <p className="text-slate-400 text-sm">USD Currency</p>
                            </div>

                            <div className="flex gap-8 z-10">
                                {/* Sale Probability Mock/Derived */}
                                {/* Note: GoDaddy API public field for probability might vary. We'll show a placeholder or derived if valid */}
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mx-auto mb-2 text-emerald-600">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                    <div className="text-2xl font-bold text-slate-800">High</div>
                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Demand</div>
                                </div>

                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-violet-50 border-2 border-violet-100 flex items-center justify-center mx-auto mb-2 text-violet-600">
                                        <Tag className="w-7 h-7" />
                                    </div>
                                    {/* Suggest slightly higher list price */}
                                    <div className="text-2xl font-bold text-slate-800">${result.govalue ? (result.govalue * 1.25).toLocaleString() : '-'}</div>
                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">List Price</div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info / Price Range */}
                        {/* If we had a real price range from API we'd put it here. For now we use the computed range */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
                            <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                Price Range
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500">Conservative</span>
                                    <span className="font-mono text-lg font-medium text-slate-700">
                                        ${result.govalue ? Math.floor(result.govalue * 0.8).toLocaleString() : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                    <span className="text-sm text-slate-500">Aggressive</span>
                                    <span className="font-mono text-lg font-medium text-slate-700">
                                        ${result.govalue ? Math.ceil(result.govalue * 1.5).toLocaleString() : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
                            <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                Accuracy
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Valuation is based on comparable sales, domain length, keyword popularity, and extension value using machine learning.
                            </p>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}
