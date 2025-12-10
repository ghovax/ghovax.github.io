# coding: utf-8
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

# Base directory for HTML files
HTML_DIR = os.path.join(os.path.dirname(__file__), 'posts/html')

BLOG_POSTS = [
    {
        'title': 'Welcome to My Blog',
        'url': '#',
        'html_file': 'welcome.html',
        'author': 'Giovanni Gravili',
        'author_link': 'https://github.com/ghovax',
        'submit_time': datetime(2025, 12, 10, 12, 0, 0),
        'image_url': None,
        'tags': ['announcement', 'meta'],
        'comment_url': None,
        'points': 0,
        'comment_count': 0,
    },
    {
        'title': 'Getting Started with Static Sites',
        'url': '#',
        'html_file': 'getting-started.html',
        'author': 'Giovanni Gravili',
        'author_link': 'https://github.com/ghovax',
        'submit_time': datetime(2025, 12, 9, 10, 30, 0),
        'image_url': None,
        'tags': ['web-development', 'tutorial'],
        'comment_url': None,
        'points': 0,
        'comment_count': 0,
    },
]


def load_html_content(html_file):
    """Load HTML content from file"""
    file_path = os.path.join(HTML_DIR, html_file)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return f'<p>Content file not found: {html_file}</p>'


def get_blog_posts():
    """
    Returns all blog posts sorted by date (newest first)
    Loads HTML content from files
    """
    posts = []
    for post_data in BLOG_POSTS:
        post = post_data.copy()
        post['summary'] = load_html_content(post_data['html_file'])
        posts.append(post)

    return sorted(posts, key=lambda x: x['submit_time'], reverse=True)
