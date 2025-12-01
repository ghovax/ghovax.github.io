import { notFound } from "next/navigation";
import { BlogHeader } from "@/components/blog-header";
import { PostContent } from "@/components/post-content";
import { PostMetadata } from "@/types/post";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { Cross, Linkedin, X } from "lucide-react";
import { Highlighter } from "@/components/ui/highlighter";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Close button */}
      <div className="max-w-[1200px] mx-auto px-4 pt-6 pb-0">
        <Link
          href="/"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border hover:bg-muted transition-colors"
        >
          <span className="text-lg">
            <X className="w-4 h-4" />
          </span>
        </Link>
      </div>

      <article className="max-w-[800px] mx-auto px-6 pb-6">
        {/* Article header */}
        <header className="mb-8">
          {/* Title */}
          <div className="text-xs md:text-sm py-2 text-muted-foreground">
            {formatDate(post.metadata.date)}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold pb-4 leading-tight border-border">
            {post.metadata.title}
          </h1>
          <span className="text-xs md:text-sm py-0 text-muted-foreground">
            {post.metadata.tags!.map((tag, index) => (
              <Link
                key={index}
                href={`/blog/tags/${tag}`}
                className="font-mono inline-block pr-2 mr-2 my-1 border-border rounded-full px-2.5 py-1 border-1 text-[0.75rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {tag}
              </Link>
            ))}
          </span>
        </header>

        {/* Article content */}
        <div className="">
          {post.metadata.image && (
            <div className="mb-8">
              <img
                src={post.metadata.image}
                alt={post.metadata.title}
                className="w-full rounded-lg border border-border"
              />
            </div>
          )}
          <PostContent htmlContent={post.content} />
        </div>

        {/* Social sharing */}
        <div className="mt-12 pt-6 border-t border-border flex items-center gap-4 pb-6">
          <button className="flex items-center gap-2 text-xs hover:opacity-70">
            <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
              @
            </span>
            Respond via e-mail
          </button>
          <button className="flex items-center gap-2 text-xs hover:opacity-70">
            <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
              <Linkedin className="w-4 h-4" />
            </span>
            Open my LinkedIn
          </button>
          <button className="flex items-center gap-2 text-xs hover:opacity-70">
            <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
              𝕏
            </span>
            Share on Twitter
          </button>
        </div>
      </article>
    </div>
  );
}
