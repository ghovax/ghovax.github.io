import { notFound } from 'next/navigation';
import { BlogHeader } from '@/components/BlogHeader';
import { PostContent } from '@/components/PostContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PostMetadata } from '@/types/post';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BlogPostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

async function getPost(slug: string): Promise<{ metadata: PostMetadata; content: string } | null> {
    try {
        // Read posts manifest
        const postsJsonPath = path.join(process.cwd(), 'posts.json');
        if (!fs.existsSync(postsJsonPath)) {
            return null;
        }

        const postsData = fs.readFileSync(postsJsonPath, 'utf-8');
        const posts: Array<PostMetadata & { htmlFile: string }> = JSON.parse(postsData);

        const post = posts.find(p => p.slug === slug);
        if (!post) {
            return null;
        }

        // Read HTML content
        const htmlPath = path.join(process.cwd(), '.posts-build', post.htmlFile);
        if (!fs.existsSync(htmlPath)) {
            return null;
        }

        const content = fs.readFileSync(htmlPath, 'utf-8');

        return {
            metadata: post,
            content
        };
    } catch (error) {
        console.error('Error loading post:', error);
        return null;
    }
}

export async function generateStaticParams() {
    try {
        const postsJsonPath = path.join(process.cwd(), 'posts.json');
        if (!fs.existsSync(postsJsonPath)) {
            return [];
        }

        const postsData = fs.readFileSync(postsJsonPath, 'utf-8');
        const posts: PostMetadata[] = JSON.parse(postsData);

        return posts.map((post) => ({
            slug: post.slug,
        }));
    } catch {
        return [];
    }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            <BlogHeader />

            <article className="max-w-2xl mx-auto px-6 py-12">
                <header className="mb-10 pb-8 border-b border-border">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">
                        {post.metadata.title}
                    </h1>

                    <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground mb-4">
                        <time>
                            {new Date(post.metadata.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </time>
                        {post.metadata.category && (
                            <>
                                <span>•</span>
                                <span>{post.metadata.category}</span>
                            </>
                        )}
                    </div>

                    {post.metadata.author && (
                        <p className="text-sm">
                            By <span className="font-medium">{post.metadata.author}</span>
                        </p>
                    )}

                    {post.metadata.tags && post.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            {post.metadata.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs font-normal">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </header>

                <PostContent htmlContent={post.content} />

                <div className="mt-16 pt-8 border-t border-border">
                    <Link
                        href="/"
                        className="text-xs uppercase tracking-widest font-medium hover:underline inline-flex items-center gap-2"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </article>

            <footer className="max-w-2xl mx-auto px-6 py-12 mt-16 text-center border-t border-border">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    © {new Date().getFullYear()} Giovanni Gravili
                </p>
            </footer>
        </div>
    );
}
