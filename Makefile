.PHONY: blog clean serve

# Generate the blog
blog:
	rm -rf output/static output/*.html output/*.xml
	uv run publish_blog.py
	cp -r static output/static
	ln -sf feed.xml output/feed
	ln -sf static/favicon.ico output/favicon.ico

# Clean generated files
clean:
	rm -rf output/

# Serve the blog locally
serve: blog
	cd output && python3 -m http.server 8000