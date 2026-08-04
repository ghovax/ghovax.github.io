# coding: utf-8
"""
Simple blog publisher - generates static HTML from blog posts
"""

import hashlib
import logging
import os
import re
import shutil
import subprocess
import time
from collections import OrderedDict
from datetime import datetime
from urllib.parse import urljoin

from feedwerk.atom import AtomFeed
from jinja2 import Environment, FileSystemLoader
from slugify import slugify

import configuration
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
        self.pinned = data.get("pinned", False)
        self.image = None
        self.summarized_by = self  # For template compatibility
        self._slug = hashlib.md5(self.title.encode()).hexdigest()[:6]

    def slug(self):
        """Generate short consistent slug from title hash"""
        return self._slug

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
environment.globals["config"] = configuration


def load_markdown_file(name):
    """Convert a top-level Markdown file to HTML using pandoc"""
    path = os.path.join(os.path.dirname(__file__), name)
    if not os.path.exists(path):
        logger.warning(f"{name} not found")
        return ""

    try:
        result = subprocess.run(
            ["pandoc", "-f", "markdown", "-t", "html", "--mathml", path],
            capture_output=True,
            text=True,
            check=True,
        )
        # A scaffold file holding only an HTML comment still renders as
        # non-empty output, which would emit an empty widget. Treat anything
        # with no visible content as absent.
        rendered = result.stdout.strip()
        if not re.sub(r"<!--.*?-->", "", rendered, flags=re.DOTALL).strip():
            return ""
        return rendered
    except FileNotFoundError:
        logger.error(f"pandoc is not on PATH, so {name} was not rendered")
        return ""
    except subprocess.CalledProcessError as e:
        logger.error(f"Error converting {name}: {e.stderr if e.stderr else str(e)}")
        return ""


def group_by_date(posts):
    """Group posts under a date header, the way the Blog widget does"""
    groups = OrderedDict()
    for post in posts:
        key = post.submit_time.date()
        groups.setdefault(key, []).append(post)

    return [
        {"date_header": day.strftime("%A, %B %d, %Y"), "posts": grouped}
        for day, grouped in groups.items()
    ]


def build_labels(posts):
    """Label widget data: every tag, sorted alphabetically"""
    counts = {}
    for post in posts:
        for tag in post.tags:
            counts[tag] = counts.get(tag, 0) + 1

    return [
        {"name": tag, "url": f"/search/label/{slugify(tag)}/", "count": counts[tag]}
        for tag in sorted(counts, key=str.lower)
    ]


def build_archive(posts):
    """BlogArchive widget data: years, then months, then post titles"""
    years = OrderedDict()
    for post in sorted(posts, key=lambda p: p.submit_time, reverse=True):
        year = post.submit_time.year
        month = post.submit_time.month
        years.setdefault(year, OrderedDict()).setdefault(month, []).append(post)

    archive = []
    for year, months in years.items():
        month_entries = [
            {
                "name": grouped[0].submit_time.strftime("%B"),
                "url": f"/{year}/{month:02d}/",
                "count": len(grouped),
                "posts": grouped,
            }
            for month, grouped in months.items()
        ]
        archive.append(
            {
                "name": str(year),
                "url": f"/{year}/",
                "count": sum(entry["count"] for entry in month_entries),
                "months": month_entries,
            }
        )

    return archive


def build_page_links(current_path):
    """PageList widget data. Mirrors the export, which lists Home only."""
    return [
        {
            "title": "Home",
            "href": f"{configuration.site}/",
            "current": current_path == "index.html",
            "external": False,
        }
    ]


def gen_blog():
    """Generate the blog homepage"""
    posts_data = get_blog_posts()
    posts = [BlogPost(p) for p in posts_data]

    labels = build_labels(posts)
    archive = build_archive(posts)

    gen_page(posts, "index.html", is_index=True, labels=labels, archive=archive)

    for post in posts:
        gen_page(
            [post],
            f"posts/{post.slug()}.html",
            is_index=False,
            labels=labels,
            archive=archive,
        )

    for label in labels:
        tagged = [post for post in posts if label["name"] in post.tags]
        gen_page(
            tagged,
            os.path.join(label["url"].strip("/"), "index.html"),
            is_index=True,
            labels=labels,
            archive=archive,
            heading=f"Showing posts with the label {label['name']}",
        )

    for year in archive:
        for month in year["months"]:
            gen_page(
                month["posts"],
                os.path.join(month["url"].strip("/"), "index.html"),
                is_index=True,
                labels=labels,
                archive=archive,
                heading=f"Showing posts from {month['name']} {year['name']}",
            )

    gen_feed(posts)

    # Copy images and other assets from each post's markdown folder to output/posts
    dst_dir = os.path.join(configuration.output_dir, "posts")
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


def gen_page(posts, path, is_index, labels, archive, heading=""):
    """Generate a static HTML page from blog posts"""
    template = environment.get_template("blog.html")
    static_page = os.path.join(configuration.output_dir, path)
    directory = os.path.dirname(static_page)
    os.makedirs(directory, exist_ok=True)

    # The About block sits on the homepage only; contact lives in the sidebar.
    about_me_html = load_markdown_file("about-me.md") if path == "index.html" else ""
    contact_info_html = load_markdown_file("contact-info.md")

    canonical = urljoin(configuration.site + "/", path.rstrip("index.html"))

    start = time.time()
    rendered = template.render(
        post_groups=group_by_date(posts),
        is_index=is_index,
        heading=heading,
        labels=labels,
        archive=archive,
        page_links=build_page_links(path),
        blog_title=configuration.blog_title,
        blog_subtitle=configuration.blog_subtitle,
        blog_description=configuration.blog_description,
        about_me=about_me_html,
        contact_info=contact_info_html,
        last_updated=datetime.utcnow(),
        canonical_url=canonical,
        path=canonical,
    )

    with open(static_page, "w") as fp:
        fp.write(rendered)

    cost = (time.time() - start) * 1000
    logger.info(f"Written {len(rendered)} bytes to {static_page}, cost(ms): {cost:.2f}")


def gen_feed(posts):
    """Generate RSS/Atom feed"""
    start = time.time()
    feed = AtomFeed(
        configuration.blog_title,
        updated=datetime.utcnow(),
        feed_url=f"{configuration.site}/feed.xml",
        url=configuration.site,
        author={"name": "Giovanni Gravili", "uri": configuration.site},
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
            url=post.url if post.url != "#" else f"{configuration.site}/#{post.slug()}",
            updated=post.submit_time,
        )

    rendered = feed.to_string()
    output_path = os.path.join(configuration.output_dir, "feed.xml")
    os.makedirs(configuration.output_dir, exist_ok=True)
    with open(output_path, "w") as fp:
        fp.write(rendered)

    cost = (time.time() - start) * 1000
    logger.info(f"Written {len(rendered)} bytes to {output_path}, cost(ms): {cost:.2f}")


if __name__ == "__main__":
    gen_blog()
