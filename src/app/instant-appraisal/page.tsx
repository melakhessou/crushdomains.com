'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Loader2, DollarSign, Activity, Tag, AlertTriangle, Sparkles, CheckCircle, XCircle, Info, TrendingUp, Briefcase, ShoppingCart, Globe, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useDomainValidation } from '@/hooks/useDomainValidation';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import BuyDomainButton from '@/components/BuyDomainButton';
import { Tooltip } from '@/components/ui/Tooltip';

interface AppraisalResult {
    domain: string;
    status: 'ok' | 'fallback_required';
    liquidity_price: number | null;
    market_price: number | null;
    buy_now_price: number | null;
    brand_score: 'high' | 'medium' | 'low';
    length: number;
    tld: string;
    word_count: number;
    tlds_registered_count?: number;
    registered_tlds?: string[];
    error?: string;
    brand_score_result?: {
        score: number;
        label: string;
        breakdown: {
            pronounceability: number;
            cvPattern: number;
            markov: number;
            entropy: number;
            brandSimilarity: number;
            length: number;
        };
    };
}

interface AvailabilityResult {
    success: boolean;
    domain: string;
    available: boolean;
    error?: string;
}

export default function InstantAppraisal() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AppraisalResult | null>(null);
    const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);

    // Domain validation hook
    const handleAppraiseDomain = useCallback(async (cleanedDomain: string) => {
        setLoading(true);
        setError(null);
        setAvailabilityError(null);
        setResult(null);
        setAvailability(null);

        try {
            const encodedDomain = encodeURIComponent(cleanedDomain);

            // Execute both calls in parallel
            const [appraisalResponse, availabilityResponse] = await Promise.all([
                fetch('/api/appraise', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domains: [cleanedDomain] })
                }).then(async r => {
                    const text = await r.text();
                    try { return JSON.parse(text); }
                    catch (e) {
                        console.error('Appraisal JSON Error:', text);
                        throw new Error('Invalid server response');
                    }
                }),
                fetch(`/api/check-availability?domain=${encodedDomain}`).then(async r => {
                    const text = await r.text();
                    try { return JSON.parse(text); }
                    catch (e) {
                        console.error('Availability JSON Error:', text);
                        return { success: false, error: 'Network error' };
                    }
                }).catch(err => ({ success: false, error: 'Network error' }))
            ]);

            // Handle Appraisal Result
            if (appraisalResponse.appraisals && appraisalResponse.appraisals.length > 0) {
                const appraisal = appraisalResponse.appraisals[0];
                setResult(appraisal);

                if (appraisal.status === 'ok') {
                    toast.success(`Appraised ${cleanedDomain}`, {
                        description: `Market value: $${appraisal.market_price?.toLocaleString()}`,
                    });
                } else {
                    toast.warning(`Appraisal limitation for ${cleanedDomain}`, {
                        description: appraisal.error || 'Check details for more info',
                    });
                }

            } else {
                const errorMsg = appraisalResponse.error || 'Failed to get appraisal';
                setError(errorMsg);
                toast.error('Appraisal failed', { description: errorMsg });
            }

            // Handle Availability Result
            if (availabilityResponse.success) {
                setAvailability(availabilityResponse);
            } else {
                setAvailabilityError('Availability could not be checked');
            }

        } catch (err: any) {
            const errorMsg = err.message || 'Something went wrong';
            setError(errorMsg);
            toast.error('Error', { description: errorMsg });
        } finally {
            setLoading(false);
        }
    }, []);

    const {
        register,
        handleSubmit,
        validationState,
        errorMessage,
        cleanedDomain,
        isSubmitting,
    } = useDomainValidation({
        onValidSubmit: handleAppraiseDomain,
        showToasts: false, // We handle toasts manually above
    });

    // Helper to get brand score color
    const getBrandScoreColor = (label: string) => {
        if (label === 'Premium') return { bg: 'bg-indigo-600', text: 'text-indigo-100', badge: 'bg-indigo-100 text-indigo-700' };
        if (label === 'Strong') return { bg: 'bg-emerald-500', text: 'text-emerald-100', badge: 'bg-emerald-100 text-emerald-700' };
        if (label === 'Average') return { bg: 'bg-amber-500', text: 'text-amber-100', badge: 'bg-amber-100 text-amber-700' };
        return { bg: 'bg-slate-400', text: 'text-slate-100', badge: 'bg-slate-100 text-slate-600' };
    };

    const isFormLoading = loading || isSubmitting;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 py-6 md:py-12 px-4 md:px-10 font-sans text-slate-800 flex flex-col items-center">

            <div className="max-w-4xl w-full space-y-6">

                {/* Header */}
                <div className="text-center space-y-2 relative">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center gap-2">
                        <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" />
                        Domain Appraisal
                    </h1>
                    <p className="text-base text-slate-500 font-medium">
                        Get a real-time market valuation using CrushDomains technology.
                    </p>
                    <div className="pt-2">
                        <Link href="/bulk-appraisal" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                            Need to appraise multiple domains? Use Bulk Appraisal
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Input Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <ValidatedInput
                                {...register('domain')}
                                placeholder="Enter domain (e.g. startup.io)"
                                icon={<Search className="h-5 w-5" />}
                                validationState={validationState}
                                errorMessage={errorMessage}
                                showCleanedValue={cleanedDomain}
                                helperText="Supports: example.com, sub.example.io — auto-strips http/https/www"
                                disabled={isFormLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isFormLoading || validationState === 'invalid'}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[180px] h-fit self-start mt-0 md:mt-0"
                        >
                            {isFormLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Get Value'
                            )}
                        </button>
                    </form>

                    {/* API Error Message */}
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
                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100 p-8 md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                <div className="space-y-4 text-center md:text-left z-10 w-full md:w-auto">
                                    <h3 className="text-slate-500 font-semibold uppercase tracking-wider text-sm flex items-center gap-2 justify-center md:justify-start">
                                        <DollarSign className="w-4 h-4" /> Market Value
                                    </h3>
                                    <div className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight">
                                        {result.market_price !== null ? `$${result.market_price.toLocaleString()}` : 'N/A'}
                                    </div>
                                    {result.status === 'fallback_required' && (
                                        <div className="text-amber-600 text-sm font-medium flex items-center gap-1 justify-center md:justify-start">
                                            <AlertTriangle className="w-4 h-4" />
                                            Estimation based on fallback logic
                                        </div>
                                    )}
                                    {result.status === 'ok' && (
                                        <div className="flex items-center justify-center md:justify-start gap-2">
                                            <span className="text-sm font-bold text-slate-400">USD Estimate</span>
                                        </div>
                                    )}
                                </div>

                                {/* Pricing Breakdown */}
                                <div className="flex-1 grid grid-cols-2 gap-4 z-10 w-full md:w-auto">

                                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col items-center md:items-start">
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> Liquidity
                                        </div>
                                        <div className="text-xl font-bold text-indigo-900">
                                            {result.liquidity_price !== null ? `$${result.liquidity_price.toLocaleString()}` : '-'}
                                        </div>
                                        <div className="text-[10px] text-indigo-400 font-medium">Fast sale price</div>
                                    </div>

                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-between">
                                        <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <ShoppingCart className="w-3 h-3" /> Retail Options
                                        </div>
                                        <div className="w-full flex justify-center">
                                            <BuyDomainButton
                                                domain={result.domain}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                                                disabled={!availability?.available}
                                            />
                                        </div>
                                        <div className="mt-2 text-[10px] text-emerald-500 font-medium text-center">
                                            Check availability & price
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Metadata & Brand Score */}
                        {result && (
                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-indigo-500" />
                                        Domain Strength
                                    </h4>
                                    {result.brand_score_result ? (
                                        <span className={clsx("text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide", getBrandScoreColor(result.brand_score_result.label).badge)}>
                                            {result.brand_score_result.label} ({result.brand_score_result.score})
                                        </span>
                                    ) : (
                                        <span className={clsx("text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide", getBrandScoreColor(result.brand_score === 'high' ? 'Premium' : result.brand_score === 'medium' ? 'Average' : 'Weak').badge)}>
                                            {result.brand_score} Brand Score
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {result.brand_score_result ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { key: 'pronounceability', label: 'Pronounceability', val: result.brand_score_result.breakdown.pronounceability, max: 40, min: -40, desc: "Evaluates vowel/consonant ratio and flow. Higher scores mean easier to say." },
                                                { key: 'cvPattern', label: 'CV Pattern', val: result.brand_score_result.breakdown.cvPattern, max: 25, min: -25, desc: "Analyzes Consonant-Vowel structures (e.g., CVCV). Rewards common patterns." },
                                                { key: 'markov', label: 'Markov/Lang', val: result.brand_score_result.breakdown.markov, max: 30, min: -35, desc: "Measures likelihood of letter sequences based on English language statistics." },
                                                { key: 'entropy', label: 'Entropy', val: result.brand_score_result.breakdown.entropy, max: 20, min: -30, desc: "Detects randomness. Low entropy = repetitive; High entropy = random usage." },
                                                { key: 'brandSimilarity', label: 'Brand Similarity', val: result.brand_score_result.breakdown.brandSimilarity, max: 30, min: -20, desc: "Checks for overlap with known brandable keywords and startup naming trends." },
                                                { key: 'length', label: 'Length', val: result.brand_score_result.breakdown.length, max: 15, min: -10, desc: "Optimizes for 5-10 characters. Penalties for very long or very short names." },
                                            ].map((metric) => {
                                                // Normalize to percentage 0-100 for bar
                                                const pct = Math.max(0, Math.min(100, ((metric.val - metric.min) / (metric.max - metric.min)) * 100));
                                                // Color based on value > 0 = good, < 0 = bad, roughly
                                                const isPositive = metric.val > 0;

                                                return (
                                                    <div key={metric.label} className="bg-slate-50 p-2 rounded-lg text-xs space-y-1 group hover:bg-slate-100 transition-colors">
                                                        <div className="flex justify-between font-semibold text-slate-600">
                                                            <Tooltip content={metric.desc}>
                                                                <span className="cursor-help border-b border-dotted border-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all flex items-center gap-1">
                                                                    {metric.label}
                                                                    <Info className="w-3 h-3 text-slate-400" />
                                                                </span>
                                                            </Tooltip>
                                                            <span className={isPositive ? 'text-emerald-600' : 'text-amber-600'}>{metric.val > 0 ? '+' : ''}{metric.val}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={clsx("h-full rounded-full", isPositive ? "bg-emerald-400" : "bg-amber-400")}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                <span className="text-sm font-medium text-slate-500">Length</span>
                                                <span className="font-bold text-slate-700">{result.length} characters</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                <span className="text-sm font-medium text-slate-500">Extension</span>
                                                <span className="font-bold text-slate-700">.{result.tld}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                <span className="text-sm font-medium text-slate-500">Word Count</span>
                                                <span className="font-bold text-slate-700">~{result.word_count}</span>
                                            </div>
                                        </>
                                    )}

                                    {result.tlds_registered_count !== undefined && (
                                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 mt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-indigo-600 flex items-center gap-1.5">
                                                    <Globe className="w-3.5 h-3.5" />
                                                    Registered TLDs
                                                </span>
                                                <span className="font-bold text-indigo-900">{result.tlds_registered_count} / 10</span>
                                            </div>
                                            {result.registered_tlds && result.registered_tlds.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {result.registered_tlds.map((tld: string) => (
                                                        <span key={tld} className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">.{tld}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Availability Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 flex flex-col justify-center min-h-[240px]">
                            <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <Search className="w-4 h-4 text-indigo-500" />
                                Availability Status
                            </h4>
                            {availability ? (
                                <div className={clsx(
                                    "p-6 rounded-xl flex items-center gap-4 border transition-all duration-500 flex-1",
                                    availability.available
                                        ? "bg-emerald-50 border-emerald-100 text-emerald-800 shadow-emerald-100"
                                        : "bg-amber-50 border-amber-100 text-amber-800 shadow-amber-100"
                                )}>
                                    {availability.available ? (
                                        <CheckCircle className="w-10 h-10 text-emerald-500 p-1 bg-white rounded-full flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-10 h-10 text-amber-500 p-1 bg-white rounded-full flex-shrink-0" />
                                    )}
                                    <div>
                                        <div className="font-bold text-2xl mb-1">
                                            {availability.available ? 'Available' : 'Taken'}
                                        </div>
                                        <div className="text-sm opacity-80 leading-relaxed">
                                            {availability.available
                                                ? 'This domain is likely available for registration!'
                                                : 'This domain is already registered to someone else.'}
                                        </div>
                                    </div>
                                </div>
                            ) : availabilityError ? (
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-slate-500">
                                    <Info className="w-5 h-5" />
                                    <span className="text-sm">{availabilityError}</span>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-200" />
                                    <span className="text-sm font-medium">Checking global registries...</span>
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
                                        <Briefcase className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h5 className="font-bold text-lg">Market Consensus</h5>
                                    <p className="text-slate-400 text-sm leading-relaxed">Values derived from liquidity (auction) and retail (marketplace) data.</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-2 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Search className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h5 className="font-bold text-lg">AI Prediction</h5>
                                    <p className="text-slate-400 text-sm leading-relaxed">Powered by advanced AI models to estimate real-time fair market value.</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-2 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h5 className="font-bold text-lg">Brand Strength</h5>
                                    <p className="text-slate-400 text-sm leading-relaxed">Analysis of length, keyword density, and TLD authority.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="mt-12 pt-8 border-t border-slate-200/60 text-center animate-in fade-in duration-700">
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl mx-auto px-4 font-medium uppercase tracking-tight">
                        These are computer-generated estimates powered by Humbleworth technology. They are not professional appraisals or investment advice, and actual sale prices may vary widely. No warranties are provided; please refer to our <a href="/terms-of-service" className="underline hover:text-indigo-500 transition-colors">Terms of Service</a> for full details.
                    </p>
                </div>

            </div>

            <footer className="mt-auto py-12 text-slate-400 text-sm font-medium">
                © 2026 CrushDomains. All rights reserved.
            </footer>
        </div>
    );
}
