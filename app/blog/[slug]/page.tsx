import { notFound } from "next/navigation";
import { PostContent } from "@/components/post-content";
import { PostMetadata } from "@/types/post";
import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { LinkedinIcon } from "lucide-react";

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
      month: "long",
      day: "numeric",
    });
  };

  // Calculate reading time (approximate)
  const calculateReadingTime = (htmlContent: string) => {
    const text = htmlContent.replace(/<[^>]*>/g, "");
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // Average reading speed
    return minutes;
  };

  const readingTime = calculateReadingTime(post.content);

  return (
    <div className="min-h-screen bg-background">
      {/* Compact article layout */}
      <article className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header section */}
        <header className="pt-8 md:pt-12 pb-6">
          {/* Title */}
          <h1 className="font-serif text-3xl font-bold leading-tight mb-3">
            {post.metadata.title}
          </h1>

          {/* Subtitle/Excerpt */}
          {post.metadata.excerpt && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 font-serif">
              {post.metadata.excerpt}
            </p>
          )}

          {/* Byline and metadata */}
          <div className="flex items-center gap-3 pt-3 pb-3 border-t border-border/50">
            <div className="flex-1">
              {post.metadata.author && (
                <div className="text-[0.8125rem] font-sans font-medium">
                  {post.metadata.author}
                </div>
              )}
              <div className="text-[0.8125rem] text-muted-foreground font-sans mt-0.5">
                {formatDate(post.metadata.date)} · {readingTime} min read
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.metadata.tags && post.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
              {post.metadata.tags.map((tag, index) => (
                <Link
                  key={index}
                  href={`/blog/tags/${tag}`}
                  className="font-sans text-xs  tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Article content */}
        <div className="pb-4">
          <PostContent htmlContent={post.content} />
        </div>

        {/* Footer section */}
        <footer className="mt-8 pt-6 border-t border-border">
          {/* Social sharing */}
          <div className="flex flex-col gap-2 pb-8">
            <button className="flex items-center gap-2 text-xs hover:opacity-70 transition-opacity">
              <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-sm">
                @
              </span>
              <span className="font-sans">Respond via email</span>
            </button>
            <button className="flex items-center gap-2 text-xs hover:opacity-70 transition-opacity">
              <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
                <LinkedinIcon className="w-4 h-4" />
              </span>
              <span className="font-sans">Connect on LinkedIn</span>
            </button>
            <button className="flex items-center gap-2 text-xs hover:opacity-70 transition-opacity">
              <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-sm">
                𝕏
              </span>
              <span className="font-sans">Share on X</span>
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
}
