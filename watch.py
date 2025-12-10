#!/usr/bin/env python3
"""
Simple file watcher - rebuilds blog when markdown files change
"""

import os
import subprocess
import time
from pathlib import Path

WATCH_DIR = Path("posts/markdown")
CHECK_INTERVAL = 2  # seconds


def get_modification_times():
    """Get modification times of all markdown files"""
    times = {}
    for md_file in WATCH_DIR.glob("**/*.md"):
        times[md_file] = md_file.stat().st_mtime
    return times


def rebuild():
    """Rebuild the blog"""
    print("\nChanges detected, rebuilding...")
    try:
        subprocess.run(["make", "blog"], check=True)
        print("Blog rebuilt successfully\n")
    except subprocess.CalledProcessError:
        print("Build failed\n")


def main():
    print(f"Watching {WATCH_DIR}/**/*.md for changes...")
    print("Press Ctrl+C to stop\n")

    last_times = get_modification_times()

    try:
        while True:
            time.sleep(CHECK_INTERVAL)
            current_times = get_modification_times()

            if current_times != last_times:
                rebuild()
                last_times = current_times

    except KeyboardInterrupt:
        print("\n\nStopped watching")


if __name__ == "__main__":
    main()
