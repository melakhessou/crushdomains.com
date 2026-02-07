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

        // Geo Mode Elements
        const geoToggle = document.querySelector('#geo-mode-toggle') as HTMLInputElement;
        const geoOptions = document.querySelector('#geo-options') as HTMLDivElement;
        const nicheContainer = document.querySelector('#niche-container') as HTMLDivElement;
        const geoBadge = document.querySelector('#geo-badge') as HTMLDivElement;

        if (!form) return;

        // --- State Management ---
        let masterResults: any[] = [];
        let totalDomainsCount = 0;
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

        // --- Geo Mode Logic ---
        if (geoToggle) {
            geoToggle.addEventListener('change', () => {
                const isGeo = geoToggle.checked;
                if (isGeo) {
                    geoOptions.classList.remove('hidden');
                    nicheContainer.classList.add('hidden');
                    geoBadge.classList.remove('hidden');
                } else {
                    geoOptions.classList.add('hidden');
                    nicheContainer.classList.remove('hidden');
                    geoBadge.classList.add('hidden');
                }
            });
        }

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
            const isGeo = geoToggle?.checked;

            const payload: any = {
                keyword1: formData.get('keyword1'),
                keyword2: formData.get('keyword2') || undefined,
            };

            if (isGeo) {
                payload.geoMode = true;
                payload.country = formData.get('country');
                payload.locationType = formData.get('locationType');
                payload.keywordPosition = formData.get('keywordPosition');
            } else {
                payload.niche = formData.get('niche');
            }

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

                const data = await response.json();
                totalDomainsCount = data.totalDomains || 0;
                masterResults = data.items || [];

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

            // Update total count display
            const countEl = document.querySelector('#total-domains-count');
            if (countEl) {
                countEl.textContent = `Total domains generated: ${totalDomainsCount}`;
            }

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

                    // Build geo info HTML if available
                    let geoInfoHtml = '';
                    if (d.city && d.style === 'geo') {
                        const popFormatted = d.population ? d.population.toLocaleString() : 'N/A';
                        const stateText = d.state || 'N/A';
                        geoInfoHtml = `
                            <div class="flex items-center gap-4 mt-2">
                                <!-- State with tooltip -->
                                <div class="flex items-center gap-1.5">
                                    <span class="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold border border-indigo-100">
                                        📍 ${d.city}, ${stateText}
                                    </span>
                                    <div class="tooltip-trigger relative flex items-center">
                                        <svg class="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-indigo-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01"></path>
                                        </svg>
                                        <div class="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] leading-relaxed font-medium rounded-lg shadow-2xl opacity-0 invisible scale-95 transition-all duration-200 ease-out z-[100] pointer-events-none text-center">
                                            <strong class="text-indigo-300">State</strong>: The US state where this city is located.
                                            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 transform rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Population with tooltip -->
                                ${d.population ? `
                                <div class="flex items-center gap-1.5">
                                    <span class="text-[9px] font-bold text-slate-500">👥 ${popFormatted}</span>
                                    <div class="tooltip-trigger relative flex items-center">
                                        <svg class="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-indigo-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01"></path>
                                        </svg>
                                        <div class="tooltip-content absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-slate-900 text-white text-[10px] leading-relaxed font-medium rounded-lg shadow-2xl opacity-0 invisible scale-95 transition-all duration-200 ease-out z-[100] pointer-events-none text-center">
                                            <strong class="text-indigo-300">Population</strong>: Estimated city population. Higher population = larger potential market.
                                            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 transform rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        `;
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
                            ${geoInfoHtml}
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="flex flex-col items-end">
                                <span class="text-xl font-black ${getScoreColor(d.score)}">${d.score}</span>
                                <div class="flex items-center justify-end gap-1.5 relative">
                                    <span class="text-[10px] text-slate-400 font-bold uppercase">Domain Score</span>
                                    <div class="tooltip-trigger relative flex items-center">
                                        <svg class="w-4 h-4 text-slate-400 cursor-help hover:text-indigo-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01"></path>
                                        </svg>
                                        <div class="tooltip-content absolute bottom-full right-0 mb-2 w-72 p-3 bg-slate-900 text-white text-xs leading-relaxed font-medium rounded-xl shadow-2xl opacity-0 invisible scale-95 transition-all duration-200 ease-out z-[100] pointer-events-none">
                                            <strong class="text-indigo-300">Domain Score</strong> is a 0–100 metric that evaluates overall domain quality including memorability, readability, brand potential, and basic SEO factors.
                                            <div class="absolute -bottom-1.5 right-3 w-3 h-3 bg-slate-900 transform rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
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
                
                /* Tooltip hover behavior */
                .tooltip-trigger:hover .tooltip-content {
                    opacity: 1;
                    visibility: visible;
                    transform: scale(1);
                }
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
                        {/* Top Row: Keywords */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Main Keyword</label>
                                <input name="keyword1" type="text" required placeholder="e.g. Dental" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Secondary (Optional)</label>
                                <input name="keyword2" type="text" placeholder="e.g. Pay" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium" />
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Geo Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" id="geo-mode-toggle" className="sr-only peer" />
                                    <div className="w-14 h-8 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                                <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">
                                    Geo domain
                                </span>
                            </label>

                            {/* Visual Hint for Geo Mode */}
                            <div id="geo-badge" className="hidden px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                                Geo Active
                            </div>
                        </div>

                        {/* Geo Options (Hidden by default) */}
                        <div id="geo-options" className="hidden grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Country</label>
                                <div className="relative">
                                    <select name="country" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer text-slate-800 font-medium">
                                        <option value="USA">USA</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Australia">Australia</option>
                                        <option value="UK">UK</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Location Type</label>
                                <div className="relative">
                                    <select name="locationType" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer text-slate-800 font-medium">
                                        <option value="Cities">Cities</option>
                                        <option value="States">States / Provinces</option>
                                        <option value="Codes">State / Province Codes</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Position</label>
                                <div className="relative">
                                    <select name="keywordPosition" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer text-slate-800 font-medium">
                                        <option value="after">City + Keyword</option>
                                        <option value="before">Keyword + City</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Niche Category (Only show if Geo is OFF) */}
                        <div id="niche-container" className="space-y-2 transition-all duration-300">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Niche Category</label>
                            <div className="relative">
                                <select name="niche" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer text-slate-800 font-medium">
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
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-black text-slate-800">Domain Suggestions</h2>
                            <span id="total-domains-count" className="text-sm font-bold text-indigo-600">Total domains generated: 0</span>
                        </div>
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

                    <p className="mt-8 text-[10px] text-slate-400 text-center font-medium">
                        All scores and valuations are automated estimates. Please refer to our <a href="/terms-of-service" className="underline hover:text-indigo-500 transition-colors">Terms of Service</a> for details.
                    </p>
                </div>

                <footer className="mt-24 text-center">
                    <p className="text-slate-400 text-sm font-medium">© 2026 Crush Domains • Premium Domain Engine</p>
                </footer>
            </div>
        </main>
    );
}
