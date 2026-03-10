import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { PageTitle } from '@/components/ui/page-title';
import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { marked } from 'marked';

type Props = {
    params: { slug: string };
};

export async function generateStaticParams() {
    const posts = getAllPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = getPostBySlug(params.slug);
    if (!post) {
        return { title: 'Post Not Found | CrushDomains' };
    }
    return {
        title: `${post.title} | Blog – CrushDomains`,
        description: post.excerpt,
    };
}

export default async function BlogPost({ params }: Props) {
    const post = getPostBySlug(params.slug);

    if (!post) {
        notFound();
    }

    const htmlContent = marked.parse(post.content);

    return (
        <main className="min-h-screen bg-slate-50 py-20 px-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm mb-12 transition-colors">
                    <ArrowLeft size={16} /> Back to Blog
                </Link>

                <article className="bg-white p-10 md:p-16 rounded-[40px] border border-slate-100 shadow-2xl">
                    <header className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Guides</span>
                            <span className="text-sm text-slate-400 font-medium">{post.date}</span>
                        </div>
                        <PageTitle className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                            {post.title}
                        </PageTitle>
                    </header>

                    <div
                        className="prose prose-slate prose-indigo lg:prose-xl max-w-none text-slate-600 leading-relaxed font-medium"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
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
