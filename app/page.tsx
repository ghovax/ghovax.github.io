import { BlogHeader } from "@/components/blog-header";
import { AboutSection } from "@/components/about-section";
import { PostMetadata } from "@/types/post";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { PostTitle } from "@/components/post-title";
import { Highlighter } from "@/components/ui/highlighter";

export default function Home() {
  // Read posts from the generated JSON manifest
  let posts: PostMetadata[] = [];

  try {
    const postsJsonPath = path.join(process.cwd(), "posts.json");
    if (fs.existsSync(postsJsonPath)) {
      const postsData = fs.readFileSync(postsJsonPath, "utf-8");
      posts = JSON.parse(postsData);
    }
  } catch (error) {
    console.error("Error loading posts:", error);
  }

  // Split posts for columnar layout
  const column1Posts = posts.slice(0, 3);
  const column2Posts = posts.slice(3, 6);
  const column3Posts = posts.slice(6, 9);
  const column4Posts = posts.slice(9, 12);

  // Color palette for highlighting different posts
  const highlightColors = [
    "#3b82f655", // blue
    "#8b5cf655", // purple
    "#ec489955", // pink
    "#f59e0b55", // amber
    "#10b98155", // emerald
    "#06b6d455", // cyan
  ];

  return (
    <div className="min-h-screen bg-background px-4">
      <BlogHeader />
      <AboutSection />

      <main className="max-w-[1200px] mx-auto px-4 py-2">
        {/* Featured Work Section */}
        <div className="border-b border-foreground/30 mb-3 pb-1 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wide">
            TECHNICAL PROJECTS & CASE STUDIES
          </h2>
        </div>

        {/* Offset columnar layout - 4 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
          {/* Column 1 */}
          <div className="lg:col-span-1 border-r-0 lg:border-r border-border lg:pr-4 space-y-4">
            {column1Posts.map((post, index) => (
              <article
                key={post.slug}
                className={index > 0 ? "border-t border-border pt-4" : ""}
              >
                <div className="mb-1">
                  {post.category && (
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {post.category}
                    </span>
                  )}
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h3
                    className={`font-bold leading-tight mb-2 hover:opacity-70 transition-opacity ${index === 0 ? "text-2xl" : "text-lg"}`}
                  >
                    {post.title}
                  </h3>
                </Link>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              </article>
            ))}
          </div>

          {/* Column 2 */}
          <div className="lg:col-span-1 border-r-0 lg:border-r border-border lg:pr-4 space-y-4">
            {column2Posts.map((post, index) => (
              <article
                key={post.slug}
                className={index > 0 ? "border-t border-border pt-4" : ""}
              >
                <div className="mb-1">
                  {post.category && (
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {post.category}
                    </span>
                  )}
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-lg font-bold leading-tight mb-2 hover:opacity-70 transition-opacity">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              </article>
            ))}
          </div>

          {/* Column 3 */}
          <div className="lg:col-span-1 border-r-0 lg:border-r border-border lg:pr-4 space-y-4">
            {column3Posts.map((post, index) => (
              <article
                key={post.slug}
                className={index > 0 ? "border-t border-border pt-4" : ""}
              >
                <div className="mb-1">
                  {post.category && (
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {post.category}
                    </span>
                  )}
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-lg font-bold leading-tight mb-2 hover:opacity-70 transition-opacity">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              </article>
            ))}
          </div>

          {/* Column 4 */}
          <div className="lg:col-span-1 space-y-4">
            {column4Posts.map((post, index) => (
              <article
                key={post.slug}
                className={index > 0 ? "border-t border-border pt-4" : ""}
              >
                <div className="mb-1">
                  {post.category && (
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {post.category}
                    </span>
                  )}
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-lg font-bold leading-tight mb-2 hover:opacity-70 transition-opacity">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              </article>
            ))}
          </div>
        </div>
      </main>

      {/* Simplified footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase mb-3 tracking-wide">
                Portfolio
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/">All Posts</Link>
                </li>
                <li>
                  <Link href="#">Projects</Link>
                </li>
                <li>
                  <Link href="#">Case Studies</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase mb-3 tracking-wide">
                Topics
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="#">Technology</Link>
                </li>
                <li>
                  <Link href="#">Design</Link>
                </li>
                <li>
                  <Link href="#">Research</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase mb-3 tracking-wide">
                Connect
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#">LinkedIn</a>
                </li>
                <li>
                  <a href="#">GitHub</a>
                </li>
                <li>
                  <a href="#">Twitter</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase mb-3 tracking-wide">
                About
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="#">About Me</Link>
                </li>
                <li>
                  <Link href="#">Contact</Link>
                </li>
                <li>
                  <Link href="#">Resume</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
