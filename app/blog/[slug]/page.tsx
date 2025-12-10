import { notFound } from "next/navigation";
import { PostContent } from "@/components/post-content";
import { PostMetadata } from "@/types/post";
import fs from "fs";
import path from "path";
import Link from "next/link";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPost(
  slug: string,
): Promise<{ metadata: PostMetadata; content: string } | null> {
  try {
    // Read posts manifest
    const postsJsonPath = path.join(process.cwd(), "posts.json");
    if (!fs.existsSync(postsJsonPath)) {
      return null;
    }

    const postsData = fs.readFileSync(postsJsonPath, "utf-8");
    const posts: Array<PostMetadata & { htmlFile: string }> =
      JSON.parse(postsData);

    const post = posts.find((p) => p.slug === slug);
    if (!post) {
      return null;
    }

    // Read HTML content
    const htmlPath = path.join(
      process.cwd(),
      "public/.posts-build",
      post.htmlFile,
    );
    if (!fs.existsSync(htmlPath)) {
      return null;
    }

    const content = fs.readFileSync(htmlPath, "utf-8");

    return {
      metadata: post,
      content,
    };
  } catch (error) {
    console.error("Error loading post:", error);
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const postsJsonPath = path.join(process.cwd(), "posts.json");
    if (!fs.existsSync(postsJsonPath)) {
      return [];
    }

    const postsData = fs.readFileSync(postsJsonPath, "utf-8");
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
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Navigation */}
        <nav className="border-b border-border py-4 mb-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Portfolio
            </Link>
          </div>
        </nav>

        <article className="pb-8">
          {/* Post title */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold mb-3">
              {post.metadata.title}
            </h1>
          </div>

          {/* Post metadata */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
            {post.metadata.author && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                {post.metadata.author}
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {formatDate(post.metadata.date)}
            </span>
            {post.metadata.category && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                {post.metadata.category}
              </span>
            )}
          </div>

          {/* Post content */}
          <div className="prose prose-lg max-w-none">
            <PostContent htmlContent={post.content} />
          </div>

          {/* Tags */}
          {post.metadata.tags && post.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
              {post.metadata.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-muted rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Footer */}
        <footer className="border-t border-border py-6 mt-8">
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>|</span>
            <Link href="/about" className="hover:text-foreground">About</Link>
            <span>|</span>
            <a href="mailto:contact@example.com" className="hover:text-foreground">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
