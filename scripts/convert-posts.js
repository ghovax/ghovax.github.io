#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const matter = require("gray-matter");

const POSTS_DIR = path.join(__dirname, "../posts");
const HTML_OUTPUT_DIR = path.join(__dirname, "../.posts-build");
const PUBLIC_POSTS_DIR = path.join(__dirname, "../public/.posts-build");
const OUTPUT_JSON = path.join(__dirname, "../posts.json");

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    console.log("Created posts directory");
  }
  if (!fs.existsSync(HTML_OUTPUT_DIR)) {
    fs.mkdirSync(HTML_OUTPUT_DIR, { recursive: true });
    console.log("Created HTML output directory");
  }
  if (!fs.existsSync(PUBLIC_POSTS_DIR)) {
    fs.mkdirSync(PUBLIC_POSTS_DIR, { recursive: true });
    console.log("Created public posts directory");
  }
}

function convertMarkdownToHTML(filepath, folderName) {
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const { data: frontmatter, content: markdown } = matter(content);

    // Use folder name as the base identifier
    const basename = folderName || path.basename(filepath, ".md");
    const htmlPath = path.join(HTML_OUTPUT_DIR, `${basename}.html`);

    // Convert markdown to HTML using pandoc with mathml
    const tempMdPath = path.join(HTML_OUTPUT_DIR, `.temp-${basename}.md`);
    fs.writeFileSync(tempMdPath, markdown);

    try {
      execSync(
        `pandoc "${tempMdPath}" -f markdown -t html --mathml -o "${htmlPath}"`,
        { stdio: "pipe" },
      );
      console.log(
        `✓ Converted ${folderName || basename}/index.md → ${basename}.html`,
      );
    } catch (error) {
      console.error(`✗ Error converting ${basename}.md:`, error.message);
      return null;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempMdPath)) {
        fs.unlinkSync(tempMdPath);
      }
    }

    // Validate required frontmatter fields
    if (!frontmatter.title || !frontmatter.date || !frontmatter.excerpt) {
      console.warn(
        `⚠ Skipping ${basename}: Missing required frontmatter (title, date, or excerpt)`,
      );
      return null;
    }

    // Generate slug from folder name if not provided
    const slug = frontmatter.slug || basename;

    return {
      ...frontmatter,
      slug,
      htmlFile: `${basename}.html`,
      postFolder: folderName || basename,
    };
  } catch (error) {
    console.error(`Error processing ${filepath}:`, error.message);
    return null;
  }
}

function copyPostAssets(postFolder) {
  const postPath = path.join(POSTS_DIR, postFolder);
  const files = fs.readdirSync(postPath);

  for (const file of files) {
    if (file === "index.md") continue; // Skip the main markdown file

    const srcPath = path.join(postPath, file);
    const stat = fs.statSync(srcPath);

    if (stat.isFile()) {
      // Create a subdirectory in both build and public folders for this post's assets
      const postBuildDir = path.join(HTML_OUTPUT_DIR, postFolder);
      const postPublicDir = path.join(PUBLIC_POSTS_DIR, postFolder);

      if (!fs.existsSync(postBuildDir)) {
        fs.mkdirSync(postBuildDir, { recursive: true });
      }
      if (!fs.existsSync(postPublicDir)) {
        fs.mkdirSync(postPublicDir, { recursive: true });
      }

      const destPathBuild = path.join(postBuildDir, file);
      const destPathPublic = path.join(postPublicDir, file);

      fs.copyFileSync(srcPath, destPathBuild);
      fs.copyFileSync(srcPath, destPathPublic);
      console.log(`  ↳ Copied ${file} to build and public directories`);
    }
  }
}

function generatePostsManifest() {
  ensurePostsDir();

  const items = fs.readdirSync(POSTS_DIR);
  const posts = [];

  for (const item of items) {
    const itemPath = path.join(POSTS_DIR, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Look for index.md in the folder
      const indexPath = path.join(itemPath, "index.md");
      if (fs.existsSync(indexPath)) {
        const post = convertMarkdownToHTML(indexPath, item);
        if (post) {
          posts.push(post);
          // Copy any additional assets from the post folder
          copyPostAssets(item);
        }
      }
    } else if (item.endsWith(".md") && !item.toLowerCase().includes("readme")) {
      // Support legacy standalone .md files (exclude README files)
      const post = convertMarkdownToHTML(itemPath, null);
      if (post) posts.push(post);
    }
  }

  if (posts.length === 0) {
    console.log("No markdown files found in posts directory");
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify([], null, 2));
    return;
  }

  // Sort by date, newest first
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(posts, null, 2));
  console.log(`\n✓ Generated posts.json with ${posts.length} post(s)`);

  // Generate a TypeScript file that Next.js will watch
  // This triggers hot reload when posts are updated
  const triggerFile = path.join(__dirname, "../lib/posts-timestamp.ts");
  const triggerContent = `// Auto-generated file - do not edit manually
// This file is updated when blog posts are converted
// Importing it ensures Next.js detects post changes

export const POSTS_LAST_UPDATED = "${new Date().toISOString()}";
`;
  fs.writeFileSync(triggerFile, triggerContent);
}

// Run the conversion
generatePostsManifest();
