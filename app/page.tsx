import { BlogHeader } from "@/components/BlogHeader";
import { PostCard } from "@/components/PostCard";
import { PostMetadata } from "@/types/post";
import fs from "fs";
import path from "path";
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

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
      </main>
    </div>
  );
}
