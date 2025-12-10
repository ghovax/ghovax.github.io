# coding: utf-8
"""
Simple blog publisher - generates static HTML from blog posts
"""

import logging
import os
import shutil
import time
from datetime import datetime
from urllib.parse import urljoin

from feedwerk.atom import AtomFeed
from jinja2 import Environment, FileSystemLoader
from slugify import slugify

import config
from blog_posts import get_blog_posts

logger = logging.getLogger(__name__)


class BlogPost:
    """Wrapper class to make blog posts compatible with the template"""

    def __init__(self, data):
        self.title = data["title"]
        self.url = data["url"]
        self.summary = data["summary"]
        self.author = data["author"]
        self.author_link = data.get("author_link", "")
        self.submit_time = data["submit_time"]
        self.image_url = data.get("image_url")
        self.tags = data.get("tags", [])
        self.comment_url = data.get("comment_url")
        self.points = data.get("points", 0)
        self.comment_count = data.get("comment_count", 0)
        self.image = None
        self.summarized_by = self  # For template compatibility

    def slug(self):
        """Generate URL-friendly slug from title"""
        return slugify(self.title)

    def get_score(self):
        """Return score for RSS filtering"""
        return self.points

    def can_truncate(self):
        """Whether summary can be truncated"""
        return False


environment = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "templates/")),
    autoescape=True,
)
environment.globals["config"] = config


def gen_blog():
    """Generate the blog homepage"""
    posts_data = get_blog_posts()
    posts = [BlogPost(p) for p in posts_data]

    gen_page(posts, "index.html")
    for post in posts:
        gen_page([post], f"posts/{post.slug()}.html")
    gen_feed(posts)

    # Copy images and other assets from each post's markdown folder to output/posts
    dst_dir = os.path.join(config.output_dir, "posts")
    os.makedirs(dst_dir, exist_ok=True)
    for post_data in posts_data:
        folder = post_data["folder"]
        src_dir = os.path.join(os.path.dirname(__file__), "posts/markdown", folder)
        if os.path.exists(src_dir):
            for file in os.listdir(src_dir):
                if file != folder + ".md":
                    src = os.path.join(src_dir, file)
                    dst = os.path.join(dst_dir, file)
                    if os.path.isdir(src):
                        shutil.copytree(src, dst, dirs_exist_ok=True)
                    else:
                        shutil.copy(src, dst)


def gen_page(posts, path):
    """Generate a static HTML page from blog posts"""
    if not posts:
        logger.warning("No posts to generate")
        return

    template = environment.get_template("blog.html")
    static_page = os.path.join(config.output_dir, path)
    directory = os.path.dirname(static_page)
    os.makedirs(directory, exist_ok=True)

    start = time.time()
    rendered = template.render(
        news_list=posts,  # Keep name for template compatibility
        last_updated=datetime.utcnow(),
        path=urljoin(config.site + "/", path.rstrip("index.html")),
    )

    with open(static_page, "w") as fp:
        fp.write(rendered)

    cost = (time.time() - start) * 1000
    logger.info(f"Written {len(rendered)} bytes to {static_page}, cost(ms): {cost:.2f}")


def gen_feed(posts):
    """Generate RSS/Atom feed"""
    start = time.time()
    feed = AtomFeed(
        "Giovanni's Portfolio",
        updated=datetime.utcnow(),
        feed_url=f"{config.site}/feed.xml",
        url=config.site,
        author={"name": "Giovanni Gravili", "uri": config.site},
    )

    for post in posts:
        img_tag = ""
        if post.image_url:
            img_tag = f'<img src="{post.image_url}" style="max-width: 100%; height: auto;" /><br />'

        feed.add(
            post.title,
            content=f"{img_tag}{post.summary}",
            author={"name": post.author, "uri": post.author_link}
            if post.author_link
            else {},
            url=post.url if post.url != "#" else f"{config.site}/#{post.slug()}",
            updated=post.submit_time,
        )

    rendered = feed.to_string()
    output_path = os.path.join(config.output_dir, "feed.xml")
    with open(output_path, "w") as fp:
        fp.write(rendered)

    cost = (time.time() - start) * 1000
    logger.info(f"Written {len(rendered)} bytes to {output_path}, cost(ms): {cost:.2f}")


if __name__ == "__main__":
    gen_blog()
