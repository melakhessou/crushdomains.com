import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

type Props = {
    params: { slug: string };
};

// Simulated post data
const GET_POST = (slug: string) => ({
    title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    content: `This is a sample article about ${slug.replace(/-/g, ' ')}. It covers the essential strategies and insights required to excel in this niche of domain investing.`,
    date: 'Feb 1, 2026'
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = GET_POST(params.slug);
    return {
        title: `${post.title} | Blog – CrushDomains`,
        description: `Read our guide on ${post.title}. Learn expert tips and strategies on CrushDomains blog.`,
    };
}

export default function BlogPost({ params }: Props) {
    const post = GET_POST(params.slug);

    return (
        <main className="min-h-screen bg-slate-50 py-20 px-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm mb-12 transition-colors">
                    <ArrowLeft size={16} /> Back to Blog
                </Link>

                <article className="bg-white p-10 md:p-16 rounded-[40px] border border-slate-100 shadow-2xl">
                    <header className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Investing</span>
                            <span className="text-sm text-slate-400 font-medium">{post.date}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                            {post.title}
                        </h1>
                    </header>

                    <div className="prose prose-slate lg:prose-xl max-w-none text-slate-600 leading-relaxed font-medium">
                        <p className="mb-8">{post.content}</p>
                        <p className="mb-8">In the fast-paced world of digital real estate, choosing the right domain is more than just a creative exercise—it's a strategic business decision. A high-quality domain serves as the foundation for your brand's online presence, influencing everything from SEO rankings to user trust.</p>
                        <div className="p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100 mb-8 italic">
                            "A domain name is your identity on the internet. Make sure it's a strong one."
                        </div>
                        <p>We'll be updating this blog regularly with more deep dives into domain strategies. Stay tuned for our upcoming guide on the impact of new gTLDs on the global market.</p>
                    </div>
                </article>

                <footer className="mt-16 text-center">
                    <div className="inline-flex items-center gap-3 p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-200">
                        <Sparkles size={24} />
                        <div className="text-left">
                            <p className="font-bold">Ready to find your domain?</p>
                            <Link href="/generator" className="text-white/80 hover:text-white text-sm font-medium underline">Try our AI Generator &rarr;</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    );
}
