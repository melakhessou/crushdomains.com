import type { Metadata } from 'next';

import { Shield, Clock, BookOpen, AlertCircle, ChevronRight, Scale, Sparkles, Gavel } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';

export const metadata: Metadata = {
    title: 'Terms of Service | CrushDomains',
    description: 'Terms and conditions for using CrushDomains platform and services.',
};

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 md:py-20 px-6 font-sans">
            <div className="max-w-4xl mx-auto space-y-12">
                <header className="text-center space-y-3 relative mb-12">
                    <PageTitle className="flex items-center justify-center gap-3">
                        <Gavel className="w-7 h-7 md:w-8 md:h-8 text-indigo-500" />
                        Terms of Service
                    </PageTitle>
                    <p className="text-base text-slate-500 font-medium mx-auto max-w-2xl">
                        Last Updated: February 6, 2026
                    </p>
                </header>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">

                    <div className="prose prose-slate max-w-none space-y-12">

                        {/* 1. Introduction */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">1</span>
                                Introduction
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Welcome to CrushDomains. These Terms of Service ("Terms") govern your access to and use of the website, tools, and services provided by CrushDomains ("we," "us," or "our"). Our platform offers domain research, generation, and valuation tools designed to assist users in identifying and analyzing domain names.
                            </p>
                        </section>

                        {/* 2. Acceptance of Terms */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">2</span>
                                Acceptance of Terms
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                By accessing or using any part of our website or services, you agree to be bound by these Terms. If you do not agree to all the terms and conditions of this agreement, you must immediately cease using the platform.
                            </p>
                        </section>

                        {/* 3. Changes to Terms */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">3</span>
                                Changes to Terms
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                We reserve the right to update or modify these Terms at any time without prior notice. Any changes will be effective immediately upon posting. Your continued use of the platform after such changes constitutes your acceptance of the new Terms.
                            </p>
                        </section>

                        {/* 4. Use of Website and Services */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">4</span>
                                Use of Website and Services
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                CrushDomains provides tools for domain exploration and data analysis. We grant you a limited, non-exclusive, non-transferable, and revocable license to use our services for personal or legitimate business research purposes, subject to these Terms.
                            </p>
                        </section>

                        {/* 5. Automated Access & Fair Use */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">5</span>
                                Automated Access & Fair Use
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                To ensure a high quality of service for all users, you agree not to:
                            </p>
                            <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-600">
                                <li>Use any "robot," "spider," or other automated devices to crawl, scrape, or harvest data from the platform.</li>
                                <li>Attempt to bypass any rate-limiting or security measures.</li>
                                <li>Engage in excessive bulk searches or appraisals that impact system performance.</li>
                            </ul>
                        </section>

                        {/* 6. Account & Newsletter */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">6</span>
                                Account & Newsletter
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                If you create an account or subscribe to our newsletter, you agree to provide accurate information. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.
                            </p>
                        </section>

                        {/* 7. Domain Data & Expiring Domains */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">7</span>
                                Domain Data & Expiring Domains
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                CrushDomains aggregates data regarding available, expired, and expiring domains.
                                <strong> We do not own the domain names listed on the platform.</strong> We cannot guarantee the availability or your ability to register any specific domain. You are responsible for verifying a domain's status and registration eligibility through an official registrar.
                            </p>
                        </section>

                        {/* 8. Prohibited Uses */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">8</span>
                                Prohibited Uses
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                You may not use our platform for any unlawful purpose, to infringe upon others' intellectual property rights, or to distribute malware, phishing links, or other harmful content.
                            </p>
                        </section>

                        {/* 9. Valuations & AI-Assisted Estimates */}
                        <section className="bg-indigo-50/50 p-6 md:p-8 rounded-2xl border border-indigo-100">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3 text-indigo-700">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">9</span>
                                Valuations & AI-Assisted Estimates
                            </h2>
                            <p className="text-slate-700 font-medium leading-relaxed mb-4">
                                Crucial Information regarding Domain Valuations and Scores:
                            </p>
                            <ul className="space-y-4 text-slate-600">
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                                    <span>All domain valuations, "Domain Scores," and brandability metrics provided by CrushDomains are **fully automated, computer-generated estimates**.</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                                    <span>These metrics are **NOT** professional real estate or financial appraisals and do not constitute investment advice.</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                                    <span>**Actual market prices may vary significantly** from our estimates based on negotiation, specific intent, market shifts, or third-party interest.</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                                    <span>Users are strongly encouraged to use their own due diligence, consult multiple sources, and perform independent market research before making any domain purchase or investment.</span>
                                </li>
                            </ul>
                        </section>

                        {/* 10. Disclaimer of Warranties */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">10</span>
                                Disclaimer of Warranties
                            </h2>
                            <p className="text-slate-600 leading-relaxed text-sm italic">
                                The platform is provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that our data will be accurate, uninterrupted, or error-free.
                            </p>
                        </section>

                        {/* 11. Limitation of Liability */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">11</span>
                                Limitation of Liability
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                To the maximum extent permitted by law, CrushDomains shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
                            </p>
                        </section>

                        {/* 12. Indemnification */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">12</span>
                                Indemnification
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                You agree to indemnify and hold CrushDomains and its affiliates harmless from any claims, damages, liabilities, and expenses arising out of your use of the platform or your violation of these Terms.
                            </p>
                        </section>

                        {/* 13. Governing Law */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">13</span>
                                Governing Law & Dispute Resolution
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                These Terms shall be governed by and construed in accordance with the laws of your jurisdiction [Placeholder: Add Region/Country]. Any dispute arising under these Terms shall be resolved exclusively through the courts of that jurisdiction.
                            </p>
                        </section>

                        {/* 14. Contact Us */}
                        <section>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">14</span>
                                Contact Us
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                For any questions regarding these Terms, please contact us at support@crushdomains.com.
                            </p>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
