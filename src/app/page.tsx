'use client';

import { useState } from 'react';
import { Search, Globe } from 'lucide-react';
import BuyDomainButton from '@/components/BuyDomainButton';

export default function LandingPage() {
  const [domain, setDomain] = useState('');

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-50 selection:bg-indigo-100 italic-none flex flex-col items-center justify-center">
      <style dangerouslySetInnerHTML={{
        __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                :root { font-family: 'Inter', sans-serif; }
                .premium-glass {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .dark .premium-glass {
                    background: rgba(15, 23, 42, 0.8);
                    border: 1px solid rgba(30, 41, 59, 0.5);
                }
            `}} />

      <div className="max-w-4xl mx-auto px-6 w-full space-y-8">
        <header className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-indigo-600 tracking-tight flex items-center justify-center gap-3">
            <Globe className="w-6 h-6 md:w-7 md:h-7 text-indigo-500 flex-shrink-0" />
            Domain Name Registration
          </h1>
          <p className="max-w-2xl mx-auto text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal uppercase tracking-wider">
            Search and register domains with CrushDomains powered by our partners.
          </p>
        </header>

        {/* Search Box in Premium Glass Card */}
        <div className="premium-glass rounded-2xl shadow-xl p-4 md:p-6 border border-white dark:border-slate-800 max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Domain Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200 font-medium text-sm shadow-inner"
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

        {/* SEO FAQ Section */}
        <section className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Everything you need to know about domain registration and our tools.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-2">What is a domain name?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A domain name is your website's address on the internet (like crushdomains.com).
                It helps users find your site easily instead of typing an IP address. We help investors find
                premium names for their portfolios.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-2">What tools do you offer for domain investors?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                CrushDomains offers an advanced AI domain appraisal tool, a geo-domain generator for local SEO,
                and a powerful filter for finding valuable expiring domains from NameJet and other lists.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-2">How accurate is the domain appraisal?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Our appraisal tool uses AI alongside market liquidity data, brand strength analysis, and historical
                sales to provide a realistic estimate of a domain's retail and auction value.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-2">Can I register domains directly here?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! When you search for a domain or find one in our tools, we provide direct links to
                register it securely through our trusted registrar partners at the best possible prices.
              </p>
            </div>
          </div>

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What is a domain name?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "A domain name is your website's address on the internet (like crushdomains.com). It helps users find your site easily instead of typing an IP address. We help investors find premium names for their portfolios."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "What tools do you offer for domain investors?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "CrushDomains offers an advanced AI domain appraisal tool, a geo-domain generator for local SEO, and a powerful filter for finding valuable expiring domains from NameJet and other lists."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How accurate is the domain appraisal?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Our appraisal tool uses AI alongside market liquidity data, brand strength analysis, and historical sales to provide a realistic estimate of a domain's retail and auction value."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Can I register domains directly here?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes! When you search for a domain or find one in our tools, we provide direct links to register it securely through our trusted registrar partners at the best possible prices."
                    }
                  }
                ]
              })
            }}
          />
        </section>

        {/* Sponsored Ad Banner */}
        <div className="flex justify-center">
          <a rel="sponsored"
            href="https://spaceship.sjv.io/c/7043229/1825519/21274" target="_top" id="1825519">
            <img src="//a.impactradius-go.com/display-ad/21274-1825519" alt="" width="668" height="105" />
          </a>
          <img height="0" width="0" src="https://imp.pxf.io/i/7043229/1825519/21274" style={{ position: 'absolute', visibility: 'hidden' }} />
        </div>

        <footer className="pt-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
            © 2026 Crush Domains • Premium Domain Engine
          </p>
        </footer>
      </div>
    </main>
  );
}
