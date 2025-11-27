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

            <article className="max-w-3xl mx-auto px-6 py-12">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="mb-8 -ml-2">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to posts
                    </Button>
                </Link>

                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <time className="text-sm text-muted-foreground">
                            {new Date(post.metadata.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </time>
                        {post.metadata.category && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <Badge variant="outline">{post.metadata.category}</Badge>
                            </>
                        )}
                    </div>

                    <h1 className="text-4xl font-bold mb-4">{post.metadata.title}</h1>

                    {post.metadata.author && (
                        <p className="text-muted-foreground">By {post.metadata.author}</p>
                    )}

                    {post.metadata.tags && post.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {post.metadata.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </header>

                <PostContent htmlContent={post.content} />
            </article>

            <footer className="max-w-3xl mx-auto px-6 py-8 mt-16 border-t border-border">
                <p className="text-sm text-muted-foreground text-center">
                    © {new Date().getFullYear()} Giovanni Gravili. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
