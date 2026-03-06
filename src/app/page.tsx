'use client';

import { useState } from 'react';
import { Search, Globe } from 'lucide-react';
import BuyDomainButton from '@/components/BuyDomainButton';

export default function LandingPage() {
  const [domain, setDomain] = useState('');

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 italic-none flex flex-col items-center justify-center">
      <style dangerouslySetInnerHTML={{
        __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                :root { font-family: 'Inter', sans-serif; }
                .premium-glass {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
            `}} />

      <div className="max-w-4xl mx-auto px-6 w-full space-y-8">
        <header className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-indigo-600 tracking-tight flex items-center justify-center gap-3">
            <Globe className="w-6 h-6 md:w-7 md:h-7 text-indigo-500 flex-shrink-0" />
            Domain Name Registration
          </h1>
          <p className="max-w-2xl mx-auto text-[11px] text-slate-500 leading-relaxed font-normal uppercase tracking-wider">
            Search and register domains with CrushDomains powered by our partners.
          </p>
        </header>

        {/* Search Box in Premium Glass Card */}
        <div className="premium-glass rounded-2xl shadow-xl p-4 md:p-6 border border-white max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Domain Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium text-sm shadow-inner"
                />
              </div>
            </div>

            <BuyDomainButton
              domain={domain || 'example.com'}
              label="Register Domain"
              className="w-full py-3 text-lg rounded-xl shadow-lg !bg-blue-600 hover:!bg-blue-700 h-auto"
              disabled={!domain.trim()}
            />
          </div>
        </div>

        <footer className="pt-12 text-center">
          <p className="text-slate-400 text-sm font-medium">
            © 2026 Crush Domains • Premium Domain Engine
          </p>
        </footer>
      </div>
    </main>
  );
}
