import Link from 'next/link';
import { PostMetadata } from '@/types/post';

interface PostCardProps {
    post: PostMetadata;
    variant?: 'featured' | 'large' | 'medium' | 'small';
    showImage?: boolean;
}

export function PostCard({ post, variant = 'medium', showImage = false }: PostCardProps) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Featured post - main story
    if (variant === 'featured') {
        return (
            <article className="border-b border-border pb-6 mb-6">
                <div className="mb-3">
                    {post.category && (
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {post.category}
                        </span>
                    )}
                </div>
                <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-4xl font-bold leading-tight mb-4 hover:opacity-70 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>
                        {post.title}
                    </h2>
                </Link>
                <p className="text-base leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                    {post.excerpt}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {post.author && <span className="font-medium">By {post.author.toUpperCase()}</span>}
                    <span>•</span>
                    <time>{formatDate(post.date)}</time>
                </div>
            </article>
        );
    }

    // Large post - secondary stories
    if (variant === 'large') {
        return (
            <article className="pb-5 mb-5 border-b border-border">
                <div className="mb-2">
                    {post.category && (
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {post.category}
                        </span>
                    )}
                </div>
                <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-2xl font-bold leading-snug mb-3 hover:opacity-70 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>
                        {post.title}
                    </h3>
                </Link>
                <p className="text-sm leading-relaxed mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    {post.excerpt}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {post.author && <span className="font-medium">BY {post.author.toUpperCase()}</span>}
                    <span>•</span>
                    <time>{formatDate(post.date)}</time>
                </div>
            </article>
        );
    }

    // Medium post - tertiary stories
    if (variant === 'medium') {
        return (
            <article className="pb-4 mb-4 border-b border-border last:border-b-0">
                <div className="mb-2">
                    {post.category && (
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {post.category}
                        </span>
                    )}
                </div>
                <Link href={`/blog/${post.slug}`}>
                    <h4 className="text-lg font-bold leading-snug mb-2 hover:opacity-70 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>
                        {post.title}
                    </h4>
                </Link>
                <p className="text-sm leading-relaxed text-muted-foreground mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    {post.excerpt}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {post.author && <span className="font-medium">BY {post.author.toUpperCase()}</span>}
                </div>
            </article>
        );
    }

    // Small post - list items
    return (
        <article className="pb-3 mb-3 border-b border-border last:border-b-0">
            <div className="mb-1">
                {post.category && (
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {post.category}
                    </span>
                )}
            </div>
            <Link href={`/blog/${post.slug}`}>
                <h5 className="text-base font-bold leading-snug hover:opacity-70 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>
                    {post.title}
                </h5>
            </Link>
        </article>
    );
}
