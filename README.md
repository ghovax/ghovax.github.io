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

To add a new blog post, simply edit `blog_posts.py` and add a new entry to the `BLOG_POSTS` list:

```python
{
    'title': 'Your Post Title',
    'url': '#',  # Use '#' for blog-only posts, or add external URL
    'summary': '''
        <p>Your post content here. You can use HTML formatting.</p>
        <p>Multiple paragraphs, lists, and other HTML elements are supported.</p>
    ''',
    'author': 'Giovanni Gravili',
    'author_link': 'https://github.com/ghovax',
    'submit_time': datetime(2025, 12, 10, 12, 0, 0),  # Publication date
    'image_url': None,  # Optional: URL to a featured image
    'tags': ['tag1', 'tag2'],  # Optional: List of tags
    'comment_url': None,  # Optional: Link to comments
    'points': 0,
    'comment_count': 0,
}
```

Commit your changes and push to GitHub - the blog will automatically rebuild and deploy!

## Local Development & Testing

### Prerequisites

- Python 3.9-3.12
- [uv](https://docs.astral.sh/uv/) (fast Python package manager)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ghovax/ghovax.github.io.git
   cd ghovax.github.io
   ```

2. Install uv if you haven't already:
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
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

