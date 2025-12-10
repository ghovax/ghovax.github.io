#!/bin/bash

# Convert all markdown files to HTML using pandoc

MARKDOWN_DIR="posts/markdown"
HTML_DIR="posts/html"

mkdir -p "$HTML_DIR"

for md_file in "$MARKDOWN_DIR"/*.md; do
    if [ -f "$md_file" ]; then
        filename=$(basename "$md_file" .md)
        html_file="$HTML_DIR/${filename}.html"

        echo "Converting $md_file -> $html_file"
        pandoc "$md_file" -o "$html_file" --wrap=none
    fi
done

echo "All markdown files converted to HTML"
