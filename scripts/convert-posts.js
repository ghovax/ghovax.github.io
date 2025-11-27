#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const matter = require('gray-matter');

const POSTS_DIR = path.join(__dirname, '../posts');
const HTML_OUTPUT_DIR = path.join(__dirname, '../.posts-build');
const OUTPUT_JSON = path.join(__dirname, '../posts.json');

function ensurePostsDir() {
    if (!fs.existsSync(POSTS_DIR)) {
        fs.mkdirSync(POSTS_DIR, { recursive: true });
        console.log('Created posts directory');
    }
    if (!fs.existsSync(HTML_OUTPUT_DIR)) {
        fs.mkdirSync(HTML_OUTPUT_DIR, { recursive: true });
        console.log('Created HTML output directory');
    }
}

function convertMarkdownToHTML(filepath) {
    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        const { data: frontmatter, content: markdown } = matter(content);

        const basename = path.basename(filepath, '.md');
        const htmlPath = path.join(HTML_OUTPUT_DIR, `${basename}.html`);

        // Convert markdown to HTML using pandoc with mathml
        const tempMdPath = path.join(HTML_OUTPUT_DIR, `.temp-${basename}.md`);
        fs.writeFileSync(tempMdPath, markdown);

        try {
            execSync(
                `pandoc "${tempMdPath}" -f markdown -t html --mathml -o "${htmlPath}"`,
                { stdio: 'pipe' }
            );
            console.log(`✓ Converted ${basename}.md → ${basename}.html`);
        } catch (error) {
            console.error(`✗ Error converting ${basename}.md:`, error.message);
            return null;
        } finally {
            // Clean up temp file
            if (fs.existsSync(tempMdPath)) {
                fs.unlinkSync(tempMdPath);
            }
        }

        // Generate slug from filename if not provided
        const slug = frontmatter.slug || basename;

        return {
            ...frontmatter,
            slug,
            htmlFile: `${basename}.html`
        };
    } catch (error) {
        console.error(`Error processing ${filepath}:`, error.message);
        return null;
    }
}

function generatePostsManifest() {
    ensurePostsDir();

    const markdownFiles = fs.readdirSync(POSTS_DIR)
        .filter(file => file.endsWith('.md'));

    if (markdownFiles.length === 0) {
        console.log('No markdown files found in posts directory');
        fs.writeFileSync(OUTPUT_JSON, JSON.stringify([], null, 2));
        return;
    }

    const posts = markdownFiles
        .map(file => convertMarkdownToHTML(path.join(POSTS_DIR, file)))
        .filter(post => post !== null)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(posts, null, 2));
    console.log(`\n✓ Generated posts.json with ${posts.length} post(s)`);

    // Generate a TypeScript file that Next.js will watch
    // This triggers hot reload when posts are updated
    const triggerFile = path.join(__dirname, '../lib/posts-timestamp.ts');
    const triggerContent = `// Auto-generated file - do not edit manually
// This file is updated when blog posts are converted
// Importing it ensures Next.js detects post changes

export const POSTS_LAST_UPDATED = "${new Date().toISOString()}";
`;
    fs.writeFileSync(triggerFile, triggerContent);
}

// Run the conversion
generatePostsManifest();
