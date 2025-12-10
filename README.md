# Giovanni's Personal Blog

[![Github Pages](https://github.com/ghovax/ghovax.github.io/actions/workflows/static.yml/badge.svg)](https://github.com/ghovax/ghovax.github.io/actions/workflows/static.yml)
[![license](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

A simple, clean personal blog built with Python and static site generation.

## Features

* Write blog posts in simple Python data structures
* Clean, responsive design
* RSS/Atom feed support
* Automatic deployment to GitHub Pages
* Sort posts by date
* Tag support

## Quick Start - Adding Blog Posts

### 1. Write in Markdown

Create a new markdown file in `posts/markdown/`:

```bash
# posts/markdown/my-new-post.md
```

Write your content using standard Markdown syntax.

### 2. Add Post Metadata

Edit `blog_posts.py` and add a new entry:

```python
{
    'title': 'My New Post',
    'url': '#',
    'html_file': 'my-new-post.html',  # Matches your .md filename
    'author': 'Giovanni Gravili',
    'author_link': 'https://github.com/ghovax',
    'submit_time': datetime(2025, 12, 10, 15, 30, 0),
    'image_url': None,
    'tags': ['tutorial'],
    'comment_url': None,
    'points': 0,
    'comment_count': 0,
}
```

### 3. Build & Deploy

The build process automatically converts Markdown → HTML → Blog.

Commit and push to GitHub - the blog will automatically rebuild and deploy!

## Local Development & Testing

### Prerequisites

- Python 3.9-3.12
- [uv](https://docs.astral.sh/uv/) (fast Python package manager)
- [pandoc](https://pandoc.org/) (for Markdown to HTML conversion)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ghovax/ghovax.github.io.git
   cd ghovax.github.io
   ```

2. Install dependencies:
   ```bash
   # Install uv
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Install pandoc (macOS)
   brew install pandoc

   # Or on Linux
   sudo apt-get install pandoc
   ```

3. (Optional) Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

### Testing Locally

To test your blog locally before pushing:

```bash
make serve
```

This will generate the static site and start a local server at `http://localhost:8000`.

Or if you prefer to do it manually:

```bash
make blog                    # Generate the site
cd output
python3 -m http.server 8000  # Serve it locally
```

### Making Changes

1. Edit `blog_posts.py` to add/modify blog posts
2. Run `make blog` to regenerate the site
3. Check your changes locally
4. Commit and push to GitHub
5. GitHub Actions will automatically deploy your changes

## Deployment

The site automatically deploys to GitHub Pages when you push to the `main` branch.

The GitHub Actions workflow:
1. Installs Python dependencies
2. Generates the blog from `blog_posts.py`
3. Deploys to GitHub Pages

You can also manually trigger deployment from the Actions tab in your GitHub repository.

### GitHub Pages Setup

Make sure GitHub Pages is enabled in your repository settings:
1. Go to Settings > Pages
2. Source: "GitHub Actions"
3. Your blog will be available at `https://ghovax.github.io/`

## Customization

### Change Blog Title and Branding

Edit `templates/blog.html`:
- Update `title` and `description` variables
- Modify the navigation links in the `nav_brand` and `nav_links` blocks

### Update Styles

- Modify CSS in `static/css/style.css`
- The blog uses Bootstrap 3 for responsive layout

### Change Author Information

Update the default author info in `blog_posts.py` or in each individual post.

### Customize Footer

Edit `templates/base_blog.html` to change footer links and information.

