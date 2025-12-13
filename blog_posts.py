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
        "emoji": "📊",
        "url": "#",
        "folder": "anki-extension",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2025, 10, 6, 12, 19, 0),
        "image_url": None,
        "tags": ["JavaScript", "Chrome Extension", "HTML", "CSS", "Anki"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
    {
        "title": "A New Framework for Integrating LLMs Into Academia",
        "emoji": "🎓",
        "url": "#",
        "folder": "bequire-full-stack",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2025, 12, 9, 10, 34, 0),
        "image_url": None,
        "tags": ["React", "Next.js", "GCS", "Firestore", "Firebase", "AI"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
    {
        "title": "Arduino-CNN Hand-Drawn Digit Classifier",
        "emoji": "🔢",
        "url": "#",
        "folder": "arduino-mnist-vision",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2025, 1, 9, 14, 11, 0),
        "image_url": None,
        "tags": ["Arduino", "C++", "Python", "Flask", "Next.js", "TensorFlow", "Keras", "AI"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
    {
        "title": "Building a PDF Generation Library from Scratch in Rust",
        "emoji": "📑",
        "url": "#",
        "folder": "textr-pdf-library",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2024, 11, 28, 17, 58, 0),
        "image_url": None,
        "tags": ["Rust", "LaTeX"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
    {
        "title": "Networked Game Engine with Entity-Component Architecture",
        "emoji": "🕹️",
        "url": "#",
        "folder": "geserver-python-flask",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2024, 12, 13, 14, 21, 0),
        "image_url": None,
        "tags": ["Python", "Flask", "GPU Programming"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
    {
        "title": "Document Editor with GTK4 and Skia From Scratch",
        "emoji": "✍️",
        "url": "#",
        "folder": "editex-skia-rust",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2024, 10, 19, 15, 50, 0),
        "image_url": None,
        "tags": ["Rust", "GTK4", "Skia", "GUI"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
    {
        "title": "Reverse Engineering the Tobii Eye Tracker 5 Protocol",
        "emoji": "🔍",
        "url": "#",
        "folder": "tobii-reverse-engineering",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2025, 11, 27, 16, 45, 0),
        "image_url": None,
        "tags": ["Reverse Engineering", "Ghidra", "USB", "Python", "C"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
    {
        "title": "Visualizing Quantum Confinement with Brillouin Zone Analysis",
        "emoji": "📐",
        "url": "#",
        "folder": "lattice-plot-mathematica",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2024, 10, 15, 13, 20, 0),
        "image_url": None,
        "tags": ["Mathematica", "Physics", "Quantum Mechanics"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
    {
        "title": "Helium Ground-State Energy with DFT",
        "emoji": "⚛️",
        "url": "#",
        "folder": "dft-helium-julia",
        "author": "Giovanni Gravili",
        "author_link": "https://github.com/ghovax",
        "submit_time": datetime(2024, 5, 18, 10, 30, 0),
        "image_url": None,
        "tags": ["Julia", "Physics", "Quantum Mechanics", "DFT"],
        "comment_url": None,
        "points": 0,
        "comment_count": 0,
    },
]


def load_markdown_content(folder):
    """Load and convert Markdown content to HTML using pandoc"""
    import subprocess
    import os

    md_file = folder + ".md"
    file_path = os.path.join(MARKDOWN_DIR, folder, md_file)
    try:
        # Run pandoc directly on the markdown file
        # Change to the markdown directory so relative image paths work
        original_cwd = os.getcwd()
        os.chdir(os.path.dirname(file_path))

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
