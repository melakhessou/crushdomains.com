import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), 'content', 'blog');

export interface BlogPost {
    title: string;
    slug: string;
    excerpt: string;
    date: string;
    content: string;
}

export function getAllPosts(): BlogPost[] {
    if (!fs.existsSync(contentDir)) {
        return [];
    }

    const fileNames = fs.readdirSync(contentDir);
    const posts = fileNames
        .filter(fileName => fileName.endsWith('.md'))
        .map(fileName => {
            const fullPath = path.join(contentDir, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');

            const { data, content } = matter(fileContents);
            const slug = fileName.replace(/\.md$/, '');

            return {
                slug,
                title: data.title || slug,
                excerpt: data.excerpt || '',
                date: data.date || new Date().toISOString(),
                content
            };
        })
        .sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1));

    return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
    try {
        const fullPath = path.join(contentDir, `${slug}.md`);
        if (!fs.existsSync(fullPath)) return null;

        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
            slug,
            title: data.title || slug,
            excerpt: data.excerpt || '',
            date: data.date || '',
            content
        };
    } catch (err) {
        return null;
    }
}
