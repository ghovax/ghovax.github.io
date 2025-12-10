# coding: utf-8
"""
Simple blog post management - add your blog posts here!

Each post is a dictionary with the following fields:
- title: The title of your blog post
- url: Link to full article (optional, can be '#' if post is only summary)
- summary: The content/summary of your post (supports HTML)
- author: Your name
- submit_time: Publication date (datetime object)
- image_url: URL to a featured image (optional)
- tags: List of tags/categories (optional)
"""

from datetime import datetime

BLOG_POSTS = [
    {
        'title': 'Welcome to My Blog',
        'url': '#',
        'summary': '''
            <p>This is my first blog post! I'm excited to share my thoughts and projects here.</p>
            <p>This blog is built with a simple static site generator and hosted on GitHub Pages.</p>
        ''',
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
        'summary': '''
            <p>Static site generators are a great way to build fast, secure websites without the need for a backend database or server-side processing.</p>
            <p>Some benefits include:</p>
            <ul>
                <li>Fast loading times</li>
                <li>Easy to host (GitHub Pages, Netlify, etc.)</li>
                <li>Version control with Git</li>
                <li>No security vulnerabilities from server-side code</li>
            </ul>
        ''',
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


def get_blog_posts():
    """
    Returns all blog posts sorted by date (newest first)
    """
    return sorted(BLOG_POSTS, key=lambda x: x['submit_time'], reverse=True)
