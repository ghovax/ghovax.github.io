import { BlogHeader } from "@/components/BlogHeader";
import { PostCard } from "@/components/PostCard";
import { PostMetadata } from "@/types/post";
import fs from "fs";
import path from "path";

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

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">No posts yet</h2>
            <p className="text-muted-foreground">
              Check back soon for new content!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-8 mt-16 border-t border-border">
        <p className="text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Giovanni Gravili. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
