"""
Simple blog post management - add your blog posts here!

Each post is a dictionary with the following fields:
- title: The title of your blog post
- url: Link to full article (optional, can be '#' if post is only summary)
- html_file: Path to HTML file (relative to posts/html/)
- author: Your name
- submit_time: Publication date (datetime object)
- image_url: URL to a featured image (optional)
- tags: List of tags/categories (optional)
"""

import os
from datetime import datetime

# Base directory for Markdown files
MARKDOWN_DIR = os.path.join(os.path.dirname(__file__), "posts/markdown")

BLOG_POSTS = [
    {
        "title": "How to Visualize Your Anki Learning Progress",
        "url": "#",
        "folder": "anki-extension",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2025, 12, 10, 12, 0, 0),
        "image_url": None,
        "tags": ["Anki", "Web Development"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
    {
        "title": "A New Framework for Integrating LLMs Into Academia",
        "url": "#",
        "folder": "bequire-full-stack",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2025, 12, 9, 10, 30, 0),
        "image_url": None,
        "tags": ["Web Development", "AI"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
]


def load_markdown_content(folder):
    """Load and convert Markdown content to HTML using pandoc"""
    import subprocess
    import tempfile
    import os
    import re

    md_file = folder + ".md"
    file_path = os.path.join(MARKDOWN_DIR, folder, md_file)
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        original_cwd = os.getcwd()
        os.chdir(os.path.dirname(file_path))
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write(content)
            temp_file = f.name
        result = subprocess.run(
            [
                "pandoc",
                "-f",
                "markdown",
                "-t",
                "html",
                "--standalone=false",
                "--mathml",
                temp_file,
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        os.unlink(temp_file)
        os.chdir(original_cwd)
        return result.stdout
    except FileNotFoundError:
        return f"<p>Content file not found: {md_file}</p>"
    except subprocess.CalledProcessError as e:
        return f"<p>Error converting markdown: {e}</p>"


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
