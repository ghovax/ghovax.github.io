# Posts Directory Structure

Each blog post should be organized in its own folder with an `index.md` file as the main content.

## Structure

```
posts/
├── post-slug-name/
│   ├── index.md          # Main post content with frontmatter
│   ├── image1.jpg        # Embedded images
│   ├── diagram.svg       # Diagrams or illustrations
│   └── data.json         # Any other attachments
└── another-post/
    └── index.md
```

## Creating a New Post

1. Create a new folder with a descriptive slug name (e.g., `my-awesome-project`)
2. Create an `index.md` file inside with frontmatter:

```markdown
---
title: "My Awesome Project"
date: "2025-11-27"
excerpt: "A brief description of your post"
category: "Technology"
tags: ["react", "nextjs", "typescript"]
author: "Giovanni Gravili"
---

# Your content here...
```

3. Add any images or attachments to the same folder
4. Reference them in your markdown using relative paths: `![Alt text](./image1.jpg)`

## Frontmatter Fields

- `title` (required): Post title
- `date` (required): Publication date in YYYY-MM-DD format
- `excerpt` (required): Short description for listings
- `category` (optional): Main category
- `tags` (optional): Array of tags
- `author` (optional): Author name
- `slug` (optional): Custom URL slug (defaults to folder name)

## Build Process

The build script (`scripts/convert-posts.js`) will:
1. Scan all folders in the `posts/` directory
2. Look for `index.md` in each folder
3. Convert markdown to HTML using Pandoc (with LaTeX math support)
4. Generate a `posts.json` manifest
5. Copy all assets to the build directory

## Development

Run `npm run dev` to start the development server with automatic post conversion on file changes.
