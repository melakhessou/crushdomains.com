'use client';

import { useState } from 'react';
import { Search, Loader2, DollarSign, Activity, Tag, AlertTriangle, Sparkles, CheckCircle, XCircle, Info } from 'lucide-react';
import clsx from 'clsx';

interface AppraisalResult {
    success: boolean;
    domain: string;
    currency: string;
    mid: number;
    low: number;
    high: number;
    confidence: number;
    domainScore: number;
    sldLength: number;
    syllables: number;
    factors: {
        length: number;
        tldTier: string;
        isDictionaryWord: boolean;
        isBrandable: boolean;
        isPremiumWord: boolean;
        pronounceability: number;
    };
    raw?: any;
}

interface AvailabilityResult {
    success: boolean;
    domain: string;
    available: boolean;
    error?: string;
}

export default function InstantAppraisal() {
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AppraisalResult | null>(null);
    const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);

    // Helper to get length category
    const getLengthCategory = (len: number) => {
        if (len <= 6) return { label: 'Short', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
        if (len <= 12) return { label: 'Medium', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
        return { label: 'Long', color: 'bg-slate-50 text-slate-700 border-slate-100' };
    };

    // Helper to get brandability category
    const getBrandabilityCategory = (syllables: number) => {
        if (syllables <= 2) return { label: 'Very Brandable', color: 'bg-emerald-100 text-emerald-800' };
        if (syllables <= 4) return { label: 'Moderately Brandable', color: 'bg-indigo-100 text-indigo-800' };
        return { label: 'Complex', color: 'bg-slate-100 text-slate-800' };
    };

    // Helper to get score color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-indigo-500';
        if (score >= 40) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const handleAppraise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain.trim()) return;

        setLoading(true);
        setError(null);
        setAvailabilityError(null);
        setResult(null);
        setAvailability(null);

        try {
            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
            const encodedDomain = encodeURIComponent(cleanDomain);

            // Execute both calls in parallel
            const [appraisalResponse, availabilityResponse] = await Promise.all([
                fetch(`/api/appraise?domain=${encodedDomain}`).then(r => r.json()),
                fetch(`/api/check-availability?domain=${encodedDomain}`).then(r => r.json()).catch(err => ({ success: false, error: 'Network error' }))
            ]);

            // Handle Appraisal Result
            if (appraisalResponse.success) {
                setResult(appraisalResponse);
            } else {
                setError(appraisalResponse.error || 'Failed to get appraisal');
            }

            // Handle Availability Result
            if (availabilityResponse.success) {
                setAvailability(availabilityResponse);
            } else {
                setAvailabilityError('Availability could not be checked');
            }

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 py-6 md:py-12 px-4 md:px-10 font-sans text-slate-800 flex flex-col items-center">

            <div className="max-w-3xl w-full space-y-6">

                {/* Header */}
                <div className="text-center space-y-2 relative">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center gap-2">
                        <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" />
                        Domain Appraisal
                    </h1>
                    <p className="text-base text-slate-500 font-medium">
                        Get a real-time market valuation using CrushDomains technology.
                    </p>
                </div>

                {/* Input Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
                    <form onSubmit={handleAppraise} className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Enter domain (e.g. startup.io)"
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
                {(result || availability || availabilityError) && (
                    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">

                        {/* Main Value Card */}
                        {result && (
                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100 p-8 md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                <div className="space-y-2 text-center md:text-left z-10 w-full md:w-auto">
                                    <h3 className="text-slate-500 font-semibold uppercase tracking-wider text-sm flex items-center gap-2 justify-center md:justify-start">
                                        <DollarSign className="w-4 h-4" /> Estimated Value
                                    </h3>
                                    <div className="text-6xl font-black text-slate-800 tracking-tight">
                                        ${result.mid?.toLocaleString()}
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                                        <span className="text-sm font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                                            {result.currency}
                                        </span>
                                        {(result.confidence ?? 0) > 0 && (
                                            <span className={clsx("text-sm font-bold px-2 py-1 rounded-lg",
                                                (result.confidence ?? 0) > 0.7 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                            )}>
                                                {Math.round((result.confidence ?? 0) * 100)}% Confidence
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Key Factors */}
                                <div className="flex-1 grid grid-cols-2 gap-y-3 gap-x-6 z-10 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    {result.factors?.isBrandable && (
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            Brandable
                                        </div>
                                    )}
                                    {result.factors?.isDictionaryWord && (
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            Dictionary Word
                                        </div>
                                    )}
                                    {result.factors?.isPremiumWord && (
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                                            Premium Keyword
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                        Length: {result.factors?.length}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                        TLD: {result.factors?.tldTier}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Domain Score Block */}
                        {result && (
                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-50 p-6 md:col-span-2 animate-in zoom-in-95 duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-indigo-500" />
                                                Domain Score
                                            </h4>
                                            <span className="text-xl font-black text-indigo-600">{result.domainScore} <span className="text-slate-300 text-sm font-bold">/ 100</span></span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                            <div
                                                className={clsx("h-full transition-all duration-1000 ease-out rounded-full", getScoreColor(result.domainScore))}
                                                style={{ width: `${result.domainScore}%` }}
                                            />
                                        </div>

                                        {/* Metrics Row */}
                                        <div className="flex flex-wrap gap-4 pt-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Length:</span>
                                                <span className="text-sm font-bold text-slate-700">{result.sldLength} chars</span>
                                                <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-bold border", getLengthCategory(result.sldLength).color)}>
                                                    {getLengthCategory(result.sldLength).label}
                                                </span>
                                            </div>
                                            <div className="w-px h-4 bg-slate-200 hidden md:block" />
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syllables:</span>
                                                <span className="text-sm font-bold text-slate-700">{result.syllables}</span>
                                                <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-bold", getBrandabilityCategory(result.syllables).color)}>
                                                    {getBrandabilityCategory(result.syllables).label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop-only visual hint */}
                                    <div className="hidden md:flex flex-col items-center justify-center p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 w-32 shrink-0">
                                        <div className="relative">
                                            <svg className="w-16 h-16 transform -rotate-90">
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * result.domainScore) / 100} className="text-indigo-500 transition-all duration-1000" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-slate-700">
                                                {result.domainScore}%
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase mt-2">Quality</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Availability Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 flex flex-col justify-center">
                            <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <Search className="w-4 h-4 text-indigo-500" />
                                Availability Status
                            </h4>
                            {availability ? (
                                <div className={clsx(
                                    "p-4 rounded-xl flex items-center gap-4 border transition-all duration-500",
                                    availability.available
                                        ? "bg-emerald-50 border-emerald-100 text-emerald-800 shadow-sm shadow-emerald-100"
                                        : "bg-amber-50 border-amber-100 text-amber-800 shadow-sm shadow-amber-100"
                                )}>
                                    {availability.available ? (
                                        <CheckCircle className="w-8 h-8 text-emerald-500 p-1 bg-white rounded-full" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-amber-500 p-1 bg-white rounded-full" />
                                    )}
                                    <div>
                                        <div className="font-bold text-lg">
                                            {availability.available ? 'Available' : 'Taken'}
                                        </div>
                                        <div className="text-sm opacity-80 leading-tight">
                                            {availability.available
                                                ? 'This domain is likely ready to register!'
                                                : 'This domain is already registered.'}
                                        </div>
                                    </div>
                                </div>
                            ) : availabilityError ? (
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-slate-500">
                                    <Info className="w-5 h-5" />
                                    <span className="text-sm">{availabilityError}</span>
                                </div>
                            ) : (
                                <div className="p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-200" />
                                    <span className="text-sm font-medium">Checking status...</span>
                                </div>
                            )}
                        </div>

                        {/* Price Range */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
                            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-indigo-500" />
                                Typical Range
                            </h4>
                            {result ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Low</div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">High</div>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full relative overflow-hidden border border-slate-50 shadow-inner">
                                        <div className="absolute inset-y-0 bg-gradient-to-r from-indigo-400/20 via-indigo-500/40 to-indigo-600/20 w-full" />
                                        <div className="absolute inset-y-0 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] w-1 rounded-full left-1/2 transform -translate-x-1/2" />
                                    </div>
                                    <div className="flex justify-between font-black text-slate-700 text-lg">
                                        <span>${result.low?.toLocaleString()}</span>
                                        <span>${result.high?.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-24 flex items-center justify-center text-slate-300 italic text-sm">
                                    Awaiting appraisal...
                                </div>
                            )}
                        </div>

                        {/* Methodology Card */}
                        <div className="md:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors duration-700" />

                            <h4 className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-xs mb-6 flex items-center gap-3">
                                <span className="w-8 h-px bg-indigo-400/30" />
                                How we value domains
                            </h4>
                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <div className="p-2 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Activity className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h5 className="font-bold text-lg">Linguistic Quality</h5>
                                    <p className="text-slate-400 text-sm leading-relaxed">Length, syllables, and keywords determine brandability and consumer trust.</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-2 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Search className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h5 className="font-bold text-lg">Market Sales</h5>
                                    <p className="text-slate-400 text-sm leading-relaxed">Comparative data from millions of historical domain sales and market trends.</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-2 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h5 className="font-bold text-lg">AI Estimation</h5>
                                    <p className="text-slate-400 text-sm leading-relaxed">Our neural network weighs factors like TLD scarcity and keyword commercial intent.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="mt-12 pt-8 border-t border-slate-200/60 text-center animate-in fade-in duration-700">
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl mx-auto px-4 font-medium uppercase tracking-tight">
                        These are computer-generated estimates. They are not professional appraisals or investment advice, and actual sale prices may vary widely. No warranties are provided; please refer to our <a href="/terms-of-service" className="underline hover:text-indigo-500 transition-colors">Terms of Service</a> for full details.
                    </p>
                </div>

            </div>

            <footer className="mt-auto py-12 text-slate-400 text-sm font-medium">
                © 2026 CrushDomains. All rights reserved.
            </footer>
        </div>
    );
}
