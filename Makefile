.PHONY: blog clean serve watch

# Generate the blog
blog:
	rm -rf output/static output/*.html output/*.xml
	uv run publish_blog.py
	cp -r static output/static
	ln -sf feed.xml output/feed
	ln -sf static/favicon.ico output/favicon.ico
	touch output/.nojekyll

# Clean generated files
clean:
	rm -rf output/

# Serve the blog locally
serve: blog
	cd output && python3 -m http.server 8000

# Watch for changes and rebuild
watch:
	@python3 watch.py