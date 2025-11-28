import { BlogHeader } from "@/components/blog-header";
import { AboutSection } from "@/components/about-section";
import { PostMetadata } from "@/types/post";
import fs from "fs";
import path from "path";
import Link from "next/link";
import { PostTitle } from "@/components/post-title";
import { Highlighter } from "@/components/ui/highlighter";
// Import timestamp to trigger hot reload when posts change
import "@/lib/posts-timestamp";

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

  // Organize posts by category
  const computationalPhysicsPosts = posts.filter(
    (post) => post.category === "Computational Physics"
  );
  const computerSciencePosts = posts.filter(
    (post) => post.category === "Computer Science"
  );
  const softwareEngineeringPosts = posts.filter(
    (post) => post.category === "Software Engineering"
  );

  // Featured posts (most recent from each category)
  const featuredPosts = [
    computationalPhysicsPosts[0],
    computerSciencePosts[0],
    softwareEngineeringPosts[0],
  ].filter(Boolean);

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
    <div className="min-h-screen bg-background">
      <BlogHeader />
      <AboutSection />

      <main className="max-w-[1200px] mx-auto px-4 py-2">
        {/* Featured Work Section */}
        <div className="border-b border-foreground mb-3 pb-0.5 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wide">
            FEATURED WORK
          </h2>
        </div>

        {/* Featured posts grid - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
          {featuredPosts.map((post, index) => (
            <article
              key={post.slug}
              className={`${
                index < featuredPosts.length - 1
                  ? "border-r-0 lg:border-r border-border lg:pr-4"
                  : ""
              }`}
            >
              {post.image ? (
                <div className="w-full h-32 mb-3 border border-border overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-32 bg-muted mb-3 border border-border"></div>
              )}
              <div className="mb-2">
                {post.category && (
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {post.category}
                  </span>
                )}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-2xl font-bold leading-tight mb-3 hover:opacity-70 transition-opacity">
                  <Highlighter
                    action="highlight"
                    color={highlightColors[index % highlightColors.length]}
                    isView={true}
                    animationDuration={1000}
                    multiline={true}
                  >
                    {post.title}
                  </Highlighter>
                </h2>
              </Link>
              <p className="text-sm leading-relaxed">{post.excerpt}</p>
            </article>
          ))}
        </div>

        {/* Computational Physics Section */}
        {computationalPhysicsPosts.length > 0 && (
          <>
            <div
              id="computational-physics"
              className="border-b border-foreground mb-3 pb-0.5 pt-4"
            >
              <h2 className="text-xs font-bold uppercase tracking-wide">
                COMPUTATIONAL PHYSICS
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
              {computationalPhysicsPosts.slice(0, 4).map((post, index) => (
                <article
                  key={post.slug}
                  className={`${
                    index < 3
                      ? "border-r-0 lg:border-r border-border lg:pr-4"
                      : ""
                  }`}
                >
                  {post.image ? (
                    <div className="w-full h-24 mb-3 border border-border overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-muted mb-3 border border-border"></div>
                  )}
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-lg font-bold leading-snug mb-2 hover:opacity-70 transition-opacity">
                      <Highlighter
                        action="highlight"
                        color={highlightColors[(index + 3) % highlightColors.length]}
                        isView={true}
                        animationDuration={800}
                        multiline={true}
                      >
                        {post.title}
                      </Highlighter>
                    </h3>
                  </Link>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}

        {/* Computer Science Section */}
        {computerSciencePosts.length > 0 && (
          <>
            <div
              id="computer-science"
              className="border-b border-foreground mb-3 pb-0.5 pt-4"
            >
              <h2 className="text-xs font-bold uppercase tracking-wide">
                COMPUTER SCIENCE
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
              {computerSciencePosts.slice(0, 4).map((post, index) => (
                <article
                  key={post.slug}
                  className={`${
                    index < 3
                      ? "border-r-0 lg:border-r border-border lg:pr-4"
                      : ""
                  }`}
                >
                  {post.image ? (
                    <div className="w-full h-24 mb-3 border border-border overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-muted mb-3 border border-border"></div>
                  )}
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-lg font-bold leading-snug mb-2 hover:opacity-70 transition-opacity">
                      <Highlighter
                        action="highlight"
                        color={highlightColors[(index + 1) % highlightColors.length]}
                        isView={true}
                        animationDuration={800}
                        multiline={true}
                      >
                        {post.title}
                      </Highlighter>
                    </h3>
                  </Link>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                </article>
              ))}
            </div>
            {/* Additional Computer Science posts in second row */}
            {computerSciencePosts.length > 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
                {computerSciencePosts.slice(4, 8).map((post, index) => (
                  <article
                    key={post.slug}
                    className={`${
                      index < 3
                        ? "border-r-0 lg:border-r border-border lg:pr-4"
                        : ""
                    }`}
                  >
                    {post.image ? (
                      <div className="w-full h-24 mb-3 border border-border overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-muted mb-3 border border-border"></div>
                    )}
                    <Link href={`/blog/${post.slug}`}>
                      <h3 className="text-lg font-bold leading-snug mb-2 hover:opacity-70 transition-opacity">
                        <Highlighter
                          action="highlight"
                          color={highlightColors[(index + 5) % highlightColors.length]}
                          isView={true}
                          animationDuration={800}
                          multiline={true}
                        >
                          {post.title}
                        </Highlighter>
                      </h3>
                    </Link>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* Software Engineering Section */}
        {softwareEngineeringPosts.length > 0 && (
          <>
            <div
              id="software-engineering"
              className="border-b border-foreground mb-3 pb-0.5 pt-4"
            >
              <h2 className="text-xs font-bold uppercase tracking-wide">
                SOFTWARE ENGINEERING
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              {softwareEngineeringPosts.slice(0, 4).map((post, index) => (
                <article
                  key={post.slug}
                  className={`${
                    index < 3
                      ? "border-r-0 lg:border-r border-border lg:pr-4"
                      : ""
                  }`}
                >
                  {post.image ? (
                    <div className="w-full h-24 mb-3 border border-border overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-muted mb-3 border border-border"></div>
                  )}
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-lg font-bold leading-snug mb-2 hover:opacity-70 transition-opacity">
                      <Highlighter
                        action="highlight"
                        color={highlightColors[(index + 2) % highlightColors.length]}
                        isView={true}
                        animationDuration={800}
                        multiline={true}
                      >
                        {post.title}
                      </Highlighter>
                    </h3>
                  </Link>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
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
