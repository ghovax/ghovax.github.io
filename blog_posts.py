"""
Simple blog post management - add your blog posts here!

Each post is a dictionary with the following fields:
- title: The title of your blog post
- url: Link to full article (optional, can be '#' if post is only summary)
- folder: Folder under posts/markdown/ holding <folder>.md and its images
- author: Your name
- author_link: Link to the author's profile (optional)
- submit_time: Publication date (datetime object)
- image_url: URL to a featured image (optional)
- tags: List of tags/categories (optional)
- pinned: Show the post above the rest (optional)

To add the first post, create posts/markdown/my-post/my-post.md and add an
entry below:

    {
        "title": "My First Post",
        "url": "#",
        "folder": "my-post",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2026, 8, 3, 12, 0, 0),
        "image_url": None,
        "tags": ["Writing"],
        "pinned": False,
    }
"""

import os
import subprocess
from datetime import datetime  # noqa: F401  (used by post entries)

# Base directory for Markdown files
MARKDOWN_DIR = os.path.join(os.path.dirname(__file__), "posts/markdown")

BLOG_POSTS = [
    {
        "title": "My first post",
        "url": "#",
        "folder": "sample-post",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2026, 8, 3, 12, 0, 0),
        "image_url": None,
        "tags": [],
        "pinned": False,
    },
]


def load_markdown_content(folder):
    """Convert a post's Markdown to HTML with pandoc"""
    file_path = os.path.join(MARKDOWN_DIR, folder)
    md_file = folder + ".md"

    try:
        # Run pandoc directly on the markdown file
        # Change to the markdown directory so relative image paths work
        original_cwd = os.getcwd()
        os.chdir(file_path)

        result = subprocess.run(
            [
                "pandoc",
                "-f",
                "markdown",
                "-t",
                "html",
                "--mathml",
                md_file,
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        os.chdir(original_cwd)
        return result.stdout
    except FileNotFoundError as e:
        return f"<p>Content file not found: {md_file} - {e}</p>"
    except subprocess.CalledProcessError as e:
        return f"<p>Error converting markdown: {e.stderr if e.stderr else str(e)}</p>"


def get_blog_posts():
    """
    Returns all blog posts sorted by date (newest first)
    Loads and converts Markdown content to HTML
    """
    posts = []
    for post_data in BLOG_POSTS:
        post = post_data.copy()
        post["summary"] = load_markdown_content(post_data["folder"])
        posts.append(post)

    return sorted(posts, key=lambda x: x["submit_time"], reverse=True)
