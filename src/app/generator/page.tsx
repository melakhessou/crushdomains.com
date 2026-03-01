'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { MapPin, Info, ExternalLink } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';
import { GeoDomainRow, GeoDomain } from '@/components/GeoDomainRow';
import { useRouter, useSearchParams } from 'next/navigation';

function GeneratorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // --- State ---
    const [keyword1, setKeyword1] = useState('');
    const [country, setCountry] = useState('USA');
    const [locationType, setLocationType] = useState('Cities');
    const [keywordPosition, setKeywordPosition] = useState('after');

    const [masterResults, setMasterResults] = useState<GeoDomain[]>([]);
    const [totalDomainsCount, setTotalDomainsCount] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Filters
    const [filterScore, setFilterScore] = useState(0);
    const [filterLength, setFilterLength] = useState<number | string>('');
    const [filterAvailability, setFilterAvailability] = useState('all');

    // Availability Cache & Queue
    const [checkCache, setCheckCache] = useState<Record<string, { available: boolean } | null>>({});
    const checkQueue = useRef<string[]>([]);
    const activeChecks = useRef(0);
    const CONCURRENT_CHECKS = 3;

    // --- initialization ---
    useEffect(() => {
        const score = searchParams.get('score');
        const maxLength = searchParams.get('maxLength');
        const available = searchParams.get('available');

        if (score) setFilterScore(parseInt(score));
        if (maxLength) setFilterLength(maxLength);
        if (available) setFilterAvailability(available);
    }, [searchParams]);

    // --- URL Syncing ---
    useEffect(() => {
        if (!hasGenerated) return;
        const params = new URLSearchParams();
        if (filterScore > 0) params.set('score', filterScore.toString());
        if (filterLength) params.set('maxLength', filterLength.toString());
        if (filterAvailability !== 'all') params.set('available', filterAvailability);

        const queryString = params.toString();
        router.replace(`${window.location.pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
    }, [filterScore, filterLength, filterAvailability, hasGenerated, router]);

    // --- Availability Logic ---
    const processQueue = async () => {
        if (activeChecks.current >= CONCURRENT_CHECKS || checkQueue.current.length === 0) return;

        const domain = checkQueue.current.shift();
        if (!domain) return;

        activeChecks.current++;
        try {
            const res = await fetch(`/api/check-domain?domain=${domain}`);
            if (!res.ok) throw new Error('Check failed');
            const data = await res.json();
            setCheckCache(prev => ({ ...prev, [domain]: { available: data.available } }));
        } catch (err) {
            setCheckCache(prev => ({ ...prev, [domain]: null })); // null represents error
        } finally {
            activeChecks.current--;
            processQueue();
        }
    };

    // --- Filtering ---
    const filteredDomains = useMemo(() => {
        const maxLength = typeof filterLength === 'string' ? parseInt(filterLength) : filterLength;
        const maxLen = maxLength || 99;

        return masterResults.filter(d => {
            const scoreMatch = d.score >= filterScore;
            const lengthMatch = d.domain.split('.')[0].length <= maxLen;

            let availabilityMatch = true;
            const status = checkCache[d.domain];
            if (filterAvailability === 'available') availabilityMatch = status?.available === true;
            if (filterAvailability === 'taken') availabilityMatch = status?.available === false;

            return scoreMatch && lengthMatch && availabilityMatch;
        });
    }, [masterResults, filterScore, filterLength, filterAvailability, checkCache]);

    // --- Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword1) return;

        setIsGenerating(true);
        setHasGenerated(false);
        setMasterResults([]);
        setCheckCache({});
        checkQueue.current = [];

        try {
            const payload = {
                keyword1,
                geoMode: true,
                country,
                locationType,
                keywordPosition,
            };

            const response = await fetch('/api/generate-domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Generation failed');

            const data = await response.json();
            const items = data.items || [];

            // Enrich items with country and mainKeyword for context
            const enrichedItems = items.map((item: any) => ({
                ...item,
                country,
                mainKeyword: keyword1
            }));

            setTotalDomainsCount(data.totalDomains || 0);
            setMasterResults(items);
            setHasGenerated(true);

            // Reset local filter UI if needed
            setFilterScore(0);
            setFilterLength('');
            setFilterAvailability('all');

            // Queue availability checks
            checkQueue.current = items.map((d: any) => d.domain);
            for (let i = 0; i < CONCURRENT_CHECKS; i++) processQueue();

        } catch (error) {
            console.error(error);
            alert('Failed to generate domains. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-indigo-500';
        if (score >= 40) return 'text-amber-500';
        return 'text-rose-500';
    };

    return (
        <main className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 italic-none">
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                :root { font-family: 'Inter', sans-serif; }
                .premium-glass {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .btn-primary {
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);
                }
                .btn-primary:hover {
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
                    transform: translateY(-1px);
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}} />

            <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
                <header className="text-center space-y-4 mb-16">
                    <PageTitle className="flex items-center justify-center gap-3">
                        <MapPin className="w-7 h-7 md:w-8 md:h-8 text-indigo-500 flex-shrink-0" />
                        Geo Domain Generator
                    </PageTitle>
                    <p className="max-w-2xl mx-auto text-lg text-slate-500 leading-relaxed font-normal">
                        Generate intelligent, location-based, and premium .com domains in seconds using our geo-focused engine.
                    </p>
                </header>

                {/* Main Generator Form */}
                <div className="premium-glass rounded-3xl shadow-2xl p-8 md:p-10 mb-12 border border-white">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Keyword</label>
                            <input
                                value={keyword1}
                                onChange={(e) => setKeyword1(e.target.value)}
                                type="text"
                                required
                                placeholder="e.g. Dental"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium"
                            />
                        </div>

                        <hr className="border-slate-100" />

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Country</label>
                                <div className="relative">
                                    <select
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer text-slate-800 font-medium"
                                    >
                                        <option value="USA">USA</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Australia">Australia</option>
                                        <option value="UK">UK</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg">▾</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Location Type</label>
                                <div className="relative">
                                    <select
                                        value={locationType}
                                        onChange={(e) => setLocationType(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer text-slate-800 font-medium"
                                    >
                                        <option value="Cities">Cities</option>
                                        <option value="States">States / Provinces</option>
                                        <option value="Codes">State / Province Codes</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg">▾</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Position</label>
                                <div className="relative">
                                    <select
                                        value={keywordPosition}
                                        onChange={(e) => setKeywordPosition(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer text-slate-800 font-medium"
                                    >
                                        <option value="after">City + Keyword</option>
                                        <option value="before">Keyword + City</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg">▾</div>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={isGenerating}
                            type="submit"
                            className="w-full py-5 btn-primary text-white font-semibold text-xl rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {isGenerating ? 'Generating...' : 'Generate Domains'}
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                {hasGenerated && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Advanced Filter Bar */}
                        <div className="bg-white/50 border border-slate-100 rounded-2xl p-6 mb-8 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min Score: <span className="text-indigo-600">{filterScore}</span></label>
                                    </div>
                                    <input
                                        value={filterScore}
                                        onChange={(e) => setFilterScore(parseInt(e.target.value))}
                                        type="range" min="0" max="100" step="5" className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Length</label>
                                    <input
                                        value={filterLength}
                                        onChange={(e) => setFilterLength(e.target.value)}
                                        type="number" placeholder="e.g. 10" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-sm font-bold text-slate-700"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Availability</label>
                                    <select
                                        value={filterAvailability}
                                        onChange={(e) => setFilterAvailability(e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                                    >
                                        <option value="all">Show All</option>
                                        <option value="available">Available Only</option>
                                        <option value="taken">Taken Only</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-2xl font-semibold text-slate-800">Domain Suggestions</h2>
                                <span className="text-base font-medium text-indigo-600">Total domains generated: {totalDomainsCount}</span>
                            </div>
                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-400 uppercase tracking-widest shadow-sm">Instant Filter Enabled</span>
                        </div>

                        <div className="grid gap-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredDomains.length === 0 ? (
                                <p className="text-center text-slate-500 py-8 italic font-medium">No domains match your filters.</p>
                            ) : (
                                filteredDomains.map((d) => (
                                    <GeoDomainRow
                                        key={d.domain}
                                        item={d}
                                        status={checkCache[d.domain]}
                                    />
                                ))
                            )}
                        </div>

                        <div className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <Info className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-indigo-900 mb-1">Refinement Tip</h4>
                                <p className="text-sm text-indigo-700/80 leading-relaxed font-medium">
                                    Use the filters above to narrow down your selection. Finding a short, high-score, available domain is the hallmark of a premium brand.
                                </p>
                            </div>
                        </div>

                        <p className="mt-8 text-[10px] text-slate-400 text-center font-medium">
                            All scores and valuations are automated estimates. Please refer to our <a href="/terms-of-service" className="underline hover:text-indigo-500 transition-colors">Terms of Service</a> for details.
                        </p>
                    </div>
                )}

                <footer className="mt-24 text-center">
                    <p className="text-slate-400 text-base font-normal">© 2026 Crush Domains • Premium Domain Engine</p>
                </footer>
            </div>
        </main>
    );
}

export default function GeneratorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-indigo-600 font-semibold animate-pulse">Loading Generator...</div>
            </div>
        }>
            <GeneratorContent />
        </Suspense>
    );
}
