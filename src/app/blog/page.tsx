import Link from 'next/link';
import type { Metadata } from 'next';
import { BookOpen, Sparkles, ArrowRight, Clock, Calendar, User, Search, Filter } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';

export const metadata: Metadata = {
    title: 'Domain Investing Blog | Tips & Strategies – CrushDomains',
    description: 'Learn how to find, appraise, and sell premium domain names with the CrushDomains blog. Expert insights for domain investors.',
};

const POSTS = [
    {
        title: 'How to Choose the Perfect Domain Name for Your Startup',
        slug: 'how-to-choose-a-domain-name',
        excerpt: 'Discover the key factors that make a domain name brandable, memorable, and valuable.',
        date: 'Feb 1, 2026'
    },
    {
        title: 'Understanding Domain Appraisal: What is Your Domain Worth?',
        slug: 'understanding-domain-appraisal',
        excerpt: 'Learn the metrics used by professionals to estimate the market value of domain names.',
        date: 'Jan 28, 2026'
    }
];

export default function BlogIndex() {
    return (
        <main className="min-h-screen bg-slate-50 py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <header className="text-center space-y-3 relative mb-12">
                    <PageTitle>
                        CrushDomains Blog
                    </PageTitle>
                    <p className="text-base text-slate-500 font-medium max-w-2xl mx-auto">
                        Insights, strategies, and guides to help you master the world of domain investing and branding.
                    </p>
                </header>

                <div className="grid gap-8">
                    {POSTS.map(post => (
                        <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                            <article className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Guides</span>
                                    <span className="text-sm text-slate-400 font-medium">{post.date}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-slate-500 mb-6 leading-relaxed">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                    Read Article <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
