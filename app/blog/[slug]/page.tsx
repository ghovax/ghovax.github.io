import { notFound } from 'next/navigation';
import { BlogHeader } from '@/components/blog-header';
import { PostContent } from '@/components/post-content';
import { PostMetadata } from '@/types/post';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <BlogHeader />

            {/* Close button - NYT style */}
            <div className="max-w-[1200px] mx-auto px-6 pt-4">
                <Link href="/" className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border hover:bg-muted transition-colors">
                    <span className="text-lg">×</span>
                </Link>
            </div>

            <article className="max-w-[800px] mx-auto px-6 py-8">
                {/* Article header */}
                <header className="mb-8">
                    {/* Title */}
                    <h1
                        className="text-4xl md:text-5xl font-normal mb-4 leading-tight border-b border-border pb-6"
                        style={{ fontFamily: 'Georgia, serif' }}
                    >
                        {post.metadata.title}
                    </h1>

                    {/* Image placeholder - matching NYT article view */}
                    <div className="w-full h-80 bg-muted mb-4 border border-border"></div>
                    <p className="text-xs text-muted-foreground mb-6 italic">
                        Caption placeholder / Credit
                    </p>

                    {/* Byline and metadata */}
                    <div className="flex items-center gap-2 text-xs mb-6">
                        {post.metadata.author && (
                            <>
                                <span className="font-bold">BY {post.metadata.author.toUpperCase()}</span>
                            </>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-6">
                        {formatDate(post.metadata.date)}
                    </div>
                </header>

                {/* Article content with NYT styling */}
                <div className="nyt-article-body">
                    {/* Lead paragraph or excerpt */}
                    {post.metadata.excerpt && (
                        <p className="text-xl leading-relaxed mb-6 font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                            {post.metadata.excerpt}
                        </p>
                    )}

                    <PostContent htmlContent={post.content} />
                </div>

                {/* Social sharing buttons - NYT style */}
                <div className="mt-12 pt-6 border-t border-border flex items-center gap-4">
                    <button className="flex items-center gap-2 text-xs hover:opacity-70">
                        <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
                            @
                        </span>
                        Email
                    </button>
                    <button className="flex items-center gap-2 text-xs hover:opacity-70">
                        <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
                            T
                        </span>
                        Twitter
                    </button>
                    <button className="flex items-center gap-2 text-xs hover:opacity-70">
                        <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
                            f
                        </span>
                        Facebook
                    </button>
                </div>

                {/* Page navigation */}
                <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Page 1 of 3</span>
                    <div className="flex gap-4">
                        <button className="hover:underline">← Previous</button>
                        <button className="hover:underline">Next →</button>
                    </div>
                </div>
            </article>

            {/* Article footer */}
            <footer className="max-w-[800px] mx-auto px-6 py-8 mt-8 border-t border-border">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} The New York Times Company
                    </p>
                </div>
            </footer>
        </div>
    );
}
