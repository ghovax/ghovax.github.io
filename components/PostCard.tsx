import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PostMetadata } from '@/types/post';

interface PostCardProps {
    post: PostMetadata;
}

export function PostCard({ post }: PostCardProps) {
    return (
        <Link href={`/blog/${post.slug}`} className="block">
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
                <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <time className="text-sm text-muted-foreground">
                            {new Date(post.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </time>
                        {post.category && (
                            <Badge variant="outline">{post.category}</Badge>
                        )}
                    </div>
                    <CardTitle className="text-xl font-bold">{post.title}</CardTitle>
                    <CardDescription className="text-base">{post.excerpt}</CardDescription>
                </CardHeader>
                {post.tags && post.tags.length > 0 && (
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>
        </Link>
    );
}
