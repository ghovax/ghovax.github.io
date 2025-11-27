import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PostMetadata } from '@/types/post';

interface PostCardProps {
    post: PostMetadata;
}

export function PostCard({ post }: PostCardProps) {
    return (
        <article className="py-8 border-b border-border last:border-b-0">
            {/* Metadata first - NYT style */}
            <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                {post.category && (
                    <>
                        <span className="font-semibold">{post.category}</span>
                        <span className="text-border">|</span>
                    </>
                )}
                <time>
                    {new Date(post.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric'
                    })}
                </time>
            </div>

            {/* Title - more balanced size */}
            <h2 className="text-xl font-bold mb-2 leading-snug">
                <Link
                    href={`/blog/${post.slug}`}
                    className="hover:opacity-70 transition-opacity"
                >
                    {post.title}
                </Link>
            </h2>

            {/* Excerpt */}
            <p className="text-sm leading-relaxed mb-3 text-foreground/70">
                {post.excerpt}
            </p>

            {/* Author byline */}
            {post.author && (
                <p className="text-xs text-muted-foreground mb-3">
                    By <span className="font-medium">{post.author}</span>
                </p>
            )}

            {/* Tags - minimal, inline */}
            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                        <span
                            key={tag}
                            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </article>
    );
}
