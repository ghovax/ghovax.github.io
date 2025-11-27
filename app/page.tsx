import { BlogHeader } from "@/components/blog-header";
import { PostCard } from "@/components/post-card";
import { PostMetadata } from "@/types/post";
import fs from "fs";
import path from "path";
import Link from "next/link";
// Import timestamp to trigger hot reload when posts change
import "@/lib/posts-timestamp";

export default function Home() {
  // Read posts from the generated JSON manifest
  let posts: PostMetadata[] = [];

  try {
    const postsJsonPath = path.join(process.cwd(), 'posts.json');
    if (fs.existsSync(postsJsonPath)) {
      const postsData = fs.readFileSync(postsJsonPath, 'utf-8');
      posts = JSON.parse(postsData);
    }
  } catch (error) {
    console.error('Error loading posts:', error);
  }

  // Split posts for the exact NYT layout
  const [featuredPost, ...remainingPosts] = posts;
  const column2Posts = remainingPosts.slice(0, 3);
  const column3Posts = remainingPosts.slice(3, 6);
  const column4Posts = remainingPosts.slice(6, 9);
  const secondRowPosts = remainingPosts.slice(9, 13);

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />

      <main className="max-w-[1200px] mx-auto px-4 py-2">
        {/* Top section label */}
        <div className="border-b border-foreground mb-3 pb-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider">TOP NEWS</h2>
        </div>

        {/* Main grid layout - 4 columns matching NYT exactly */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
          {/* Column 1 - Featured story with image */}
          <div className="lg:col-span-1 border-r-0 lg:border-r border-border lg:pr-4">
            {featuredPost && (
              <article className="pb-4">
                {/* Simulated image placeholder */}
                <div className="w-full h-32 bg-muted mb-3 border border-border"></div>

                <Link href={`/blog/${featuredPost.slug}`}>
                  <h2 className="text-2xl font-bold leading-tight mb-3 hover:opacity-70 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>
                    {featuredPost.title}
                  </h2>
                </Link>
                <p className="text-sm leading-relaxed mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  {featuredPost.excerpt}
                </p>
                <div className="text-xs text-muted-foreground">
                  {featuredPost.author && <span className="font-medium">BY {featuredPost.author.toUpperCase()}</span>}
                </div>
              </article>
            )}

            {/* Second story in column 1 */}
            <div className="border-t border-border pt-4">
              {secondRowPosts[0] && (
                <article>
                  <div className="mb-2">
                    {secondRowPosts[0].category && (
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {secondRowPosts[0].category}
                      </span>
                    )}
                  </div>
                  <Link href={`/blog/${secondRowPosts[0].slug}`}>
                    <h3 className="text-lg font-bold leading-snug mb-2 hover:opacity-70 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>
                      {secondRowPosts[0].title}
                    </h3>
                  </Link>
                  <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: 'Georgia, serif' }}>
                    {secondRowPosts[0].excerpt}
                  </p>
                </article>
              )}
            </div>
          </div>

          {/* Column 2 - Multiple stories */}
          <div className="lg:col-span-1 border-r-0 lg:border-r border-border lg:pr-4 space-y-4">
            {column2Posts.map((post, index) => (
              <article key={post.slug} className={index > 0 ? "border-t border-border pt-4" : ""}>
                <div className="mb-2">
                  {post.category && (
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {post.category}
                    </span>
                  )}
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-lg font-bold leading-snug mb-2 hover:opacity-70 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>
                    {post.title}
                  </h3>
                </Link>
                <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: 'Georgia, serif' }}>
                  {post.excerpt}
                </p>
                <div className="text-xs text-muted-foreground mt-2">
                  {post.author && <span className="font-medium">BY {post.author.toUpperCase()}</span>}
                </div>
              </article>
            ))}
          </div>

          {/* Column 3 - Multiple stories */}
          <div className="lg:col-span-1 border-r-0 lg:border-r border-border lg:pr-4 space-y-4">
            {column3Posts.map((post, index) => (
              <article key={post.slug} className={index > 0 ? "border-t border-border pt-4" : ""}>
                <div className="mb-2">
                  {post.category && (
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {post.category}
                    </span>
                  )}
                </div>
                {index === 0 && (
                  <div className="w-full h-24 bg-muted mb-3 border border-border"></div>
                )}
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-lg font-bold leading-snug mb-2 hover:opacity-70 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>
                    {post.title}
                  </h3>
                </Link>
                <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: 'Georgia, serif' }}>
                  {post.excerpt}
                </p>
                <div className="text-xs text-muted-foreground mt-2">
                  {post.author && <span className="font-medium">BY {post.author.toUpperCase()}</span>}
                </div>
              </article>
            ))}
          </div>

          {/* Column 4 - Multiple stories with image */}
          <div className="lg:col-span-1 space-y-4">
            {column4Posts.map((post, index) => (
              <article key={post.slug} className={index > 0 ? "border-t border-border pt-4" : ""}>
                <div className="mb-2">
                  {post.category && (
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {post.category}
                    </span>
                  )}
                </div>
                {index === 0 && (
                  <div className="w-full h-24 bg-muted mb-3 border border-border"></div>
                )}
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="text-lg font-bold leading-snug mb-2 hover:opacity-70 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>
                    {post.title}
                  </h3>
                </Link>
                <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: 'Georgia, serif' }}>
                  {post.excerpt}
                </p>
                <div className="text-xs text-muted-foreground mt-2">
                  {post.author && <span className="font-medium">BY {post.author.toUpperCase()}</span>}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Second row - 4 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {secondRowPosts.slice(1).map((post) => (
            <article key={post.slug} className="border-t-0">
              <div className="mb-2">
                {post.category && (
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {post.category}
                  </span>
                )}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h3 className="text-lg font-bold leading-snug mb-2 hover:opacity-70 transition-opacity" style={{ fontFamily: 'Georgia, serif' }}>
                  {post.title}
                </h3>
              </Link>
              <p className="text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: 'Georgia, serif' }}>
                {post.excerpt}
              </p>
              <div className="text-xs text-muted-foreground mt-2">
                {post.author && <span className="font-medium">BY {post.author.toUpperCase()}</span>}
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Simplified footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-[1200px] mx-auto px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} The New York Times Company
          </p>
        </div>
      </footer>
    </div>
  );
}
