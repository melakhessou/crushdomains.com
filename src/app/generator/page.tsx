'use client';

import { useEffect } from 'react';

export default function GeneratorPage() {
    useEffect(() => {
        // Vanilla JavaScript Logic
        const form = document.querySelector('#generator-form') as HTMLFormElement;
        const resultsContainer = document.querySelector('#results-container') as HTMLDivElement;
        const resultsList = document.querySelector('#results-list') as HTMLDivElement;
        const generateBtn = document.querySelector('#generate-btn') as HTMLButtonElement;

        // Filter Elements
        const filterScore = document.querySelector('#filter-score') as HTMLInputElement;
        const filterLength = document.querySelector('#filter-length') as HTMLInputElement;
        const filterAvailability = document.querySelector('#filter-availability') as HTMLSelectElement;
        const scoreValue = document.querySelector('#score-value') as HTMLSpanElement;

        if (!form) return;

        // --- State Management ---
        let masterResults: any[] = [];
        const CONCURRENT_CHECKS = 3;
        const checkQueue: string[] = [];
        let activeChecks = 0;
        const checkCache = new Map<string, { available: boolean }>();

        // --- URL Syncing Logic ---
        function syncFiltersToUrl() {
            const params = new URLSearchParams();
            if (filterScore.value !== "0") params.set('score', filterScore.value);
            if (filterLength.value) params.set('maxLength', filterLength.value);
            if (filterAvailability.value !== 'all') params.set('available', filterAvailability.value);

            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }

        function loadFiltersFromUrl() {
            const params = new URLSearchParams(window.location.search);
            if (params.has('score')) {
                filterScore.value = params.get('score')!;
                scoreValue.innerText = filterScore.value;
            }
            if (params.has('maxLength')) filterLength.value = params.get('maxLength')!;
            if (params.has('available')) filterAvailability.value = params.get('available')!;
        }

        loadFiltersFromUrl();

        // --- Filtering Logic ---
        function applyFilters() {
            const minScore = parseInt(filterScore.value);
            const maxLength = parseInt(filterLength.value) || 99;
            const availability = filterAvailability.value;

            scoreValue.innerText = minScore.toString();
            syncFiltersToUrl();

            const filtered = masterResults.filter(d => {
                const scoreMatch = d.score >= minScore;
                const lengthMatch = d.domain.split('.')[0].length <= maxLength;

                let availabilityMatch = true;
                const status = checkCache.get(d.domain);
                if (availability === 'available') availabilityMatch = status?.available === true;
                if (availability === 'taken') availabilityMatch = status?.available === false;

                return scoreMatch && lengthMatch && availabilityMatch;
            });

            renderUI(filtered);
        }

        // Listen for filter changes
        [filterScore, filterLength, filterAvailability].forEach(el => {
            el.addEventListener('input', applyFilters);
        });

        // --- Availability Check Logic ---
        async function processQueue() {
            if (activeChecks >= CONCURRENT_CHECKS || checkQueue.length === 0) return;

            const domain = checkQueue.shift();
            if (!domain) return;

            activeChecks++;
            await checkAvailability(domain);
            activeChecks--;
            processQueue();
        }

        async function checkAvailability(domain: string) {
            try {
                if (!checkCache.has(domain)) {
                    const res = await fetch(`/api/check-domain?domain=${domain}`);
                    if (!res.ok) throw new Error('Check failed');
                    const data = await res.json();
                    checkCache.set(domain, { available: data.available });
                }

                // Only update UI if filters still allow this domain to be visible
                updateSingleDomainStatus(domain, checkCache.get(domain)!.available);
            } catch (err) {
                const statusEl = document.querySelector(`[data-status-for="${domain}"]`);
                if (statusEl) statusEl.innerHTML = '<span class="text-rose-400 text-[10px] font-bold">Error</span>';
            }
        }

        function updateSingleDomainStatus(domain: string, available: boolean) {
            const statusEl = document.querySelector(`[data-status-for="${domain}"]`);
            if (!statusEl) return;

            if (available) {
                statusEl.innerHTML = '<span class="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">🟢 Available</span>';
            } else {
                statusEl.innerHTML = '<span class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold border border-slate-100">🔴 Taken</span>';
            }

            // Re-apply filters in case "Available Only" or "Taken Only" is active
            if (filterAvailability.value !== 'all') {
                applyFilters();
            }
        }

        // --- Main Event Handlers ---

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const payload = {
                keyword1: formData.get('keyword1'),
                keyword2: formData.get('keyword2') || undefined,
                niche: formData.get('niche')
            };

            if (!payload.keyword1) return;

            generateBtn.disabled = true;
            generateBtn.innerText = 'Generating...';
            resultsContainer.classList.add('hidden');

            try {
                const response = await fetch('/api/generate-domains', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Generation failed');

                masterResults = await response.json();

                // Reset filters to defaults on new generation
                filterScore.value = "0";
                filterLength.value = "";
                filterAvailability.value = "all";
                scoreValue.innerText = "0";

                applyFilters();

                // Start availability checks
                checkQueue.length = 0;
                masterResults.forEach(d => checkQueue.push(d.domain));
                for (let i = 0; i < CONCURRENT_CHECKS; i++) processQueue();

            } catch (error) {
                console.error(error);
                alert('Failed to generate domains. Please try again.');
            } finally {
                generateBtn.disabled = false;
                generateBtn.innerText = 'Generate Domains';
            }
        });

        function renderUI(domains: any[]) {
            resultsList.innerHTML = '';

            if (domains.length === 0) {
                resultsList.innerHTML = '<p class="text-center text-slate-500 py-8 italic font-medium">No domains match your filters.</p>';
            } else {
                domains.forEach(d => {
                    const card = document.createElement('div');
                    card.className = 'flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-all hover:shadow-md group';

                    const status = checkCache.get(d.domain);
                    let statusHtml = '<span class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold border border-slate-100 animate-pulse">Checking...</span>';

                    if (status) {
                        statusHtml = status.available
                            ? '<span class="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">🟢 Available</span>'
                            : '<span class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-bold border border-slate-100">🔴 Taken</span>';
                    }

                    card.innerHTML = `
                        <div class="flex flex-col gap-1">
                            <div class="flex items-center gap-3">
                                <span class="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">${d.domain}</span>
                                <div data-status-for="${d.domain}" class="flex items-center">
                                    ${statusHtml}
                                </div>
                            </div>
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${d.style}</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="flex flex-col items-end">
                                <span class="text-xl font-black ${getScoreColor(d.score)}">${d.score}</span>
                                <span class="text-[10px] text-slate-400 font-bold uppercase">Brand Score</span>
                            </div>
                        </div>
                    `;
                    resultsList.appendChild(card);
                });
            }

            resultsContainer.classList.remove('hidden');
        }

        function getScoreColor(score: number) {
            if (score >= 80) return 'text-emerald-500';
            if (score >= 60) return 'text-indigo-500';
            if (score >= 40) return 'text-amber-500';
            return 'text-rose-500';
        }
    }, []);

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
                .gradient-text {
                    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
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
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
                        Domain <span className="gradient-text">Generator</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
                        Generate intelligent, brandable, and premium .com domains in seconds using our niche-optimized engine.
                    </p>
                </div>

                {/* Main Generator Form */}
                <div className="premium-glass rounded-3xl shadow-2xl p-8 md:p-10 mb-12 border border-white">
                    <form id="generator-form" className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Main Keyword</label>
                                <input name="keyword1" type="text" required placeholder="e.g. Swift" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Secondary (Optional)</label>
                                <input name="keyword2" type="text" placeholder="e.g. Pay" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Niche Category</label>
                            <div className="relative">
                                <select name="niche" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer text-slate-800 font-medium">
                                    <option value="Business">Business</option>
                                    <option value="Tech">Tech</option>
                                    <option value="Wellness / Spa">Wellness / Spa</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Real Estate">Real Estate</option>
                                    <option value="Auto">Auto</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                        <button id="generate-btn" type="submit" className="w-full py-5 btn-primary text-white font-bold text-lg rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                            Generate Domains
                        </button>
                    </form>
                </div>

                {/* Results Section */}
                <div id="results-container" className="hidden animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Advanced Filter Bar */}
                    <div className="bg-white/50 border border-slate-100 rounded-2xl p-6 mb-8 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min Score: <span id="score-value" className="text-indigo-600">0</span></label>
                                </div>
                                <input id="filter-score" type="range" min="0" max="100" step="5" defaultValue="0" className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Max Length</label>
                                <input id="filter-length" type="number" placeholder="e.g. 10" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-sm font-bold text-slate-700" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Availability</label>
                                <select id="filter-availability" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 text-sm font-bold text-slate-700 appearance-none cursor-pointer">
                                    <option value="all">Show All</option>
                                    <option value="available">Available Only</option>
                                    <option value="taken">Taken Only</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-slate-800">Domain Suggestions</h2>
                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">Instant Filter Enabled</span>
                    </div>

                    <div id="results-list" className="grid gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Results injected here */}
                    </div>

                    <div className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-900 mb-1">Refinement Tip</h4>
                            <p className="text-sm text-indigo-700/80 leading-relaxed font-medium">
                                Use the filters above to narrow down your selection. Finding a short, high-score, available domain is the hallmark of a premium brand.
                            </p>
                        </div>
                    </div>
                </div>

                <footer className="mt-24 text-center">
                    <p className="text-slate-400 text-sm font-medium">© 2026 Crush Domains • Premium Domain Engine</p>
                </footer>
            </div>
        </main>
    );
}
