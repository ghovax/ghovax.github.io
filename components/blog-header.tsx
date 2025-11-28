"use client";

import Link from "next/link";
import { Highlighter } from "./ui/highlighter";

export function BlogHeader() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="w-full border-b-2 border-foreground pt-2">
      {/* Top bar with date only */}
      <div className="border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-2">
          <time className="text-sm text-muted-foreground font-medium">
            {today}
          </time>
        </div>
      </div>

      {/* Masthead - Portfolio style logo */}
      <div className="max-w-[1200px] mx-auto px-4 pb-4 text-left">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-bold tracking-tight">
            Giovanni Gravili&rsquo;s{" "}
            <Highlighter
              action="highlight"
              color="#ef444460"
              isView={false}
              animationDuration={800}
            >
              Work Portfolio
            </Highlighter>{" "}
            & Blog
          </h1>
        </Link>
      </div>

      {/* Sections bar */}
      <div className="border-t border-border">
        <nav className="max-w-[1200px] mx-auto px-4">
          <ul className="flex items-center justify-between tracking-wide py-3 text-xs font-semibold overflow-x-auto">
            <div className="flex items-center gap-6">
              <li>
                <Link href="/" className="whitespace-nowrap">
                  ALL POSTS
                </Link>
              </li>
              <li>
                <Link href="#computational-physics" className="whitespace-nowrap">
                  COMPUTATIONAL PHYSICS
                </Link>
              </li>
              <li>
                <Link href="#computer-science" className="whitespace-nowrap">
                  COMPUTER SCIENCE
                </Link>
              </li>
              <li>
                <Link href="#software-engineering" className="whitespace-nowrap">
                  SOFTWARE ENGINEERING
                </Link>
              </li>
            </div>
            <div className="flex items-center gap-6 ml-auto">
              <li>
                <Link href="#about" className="whitespace-nowrap">
                  ABOUT
                </Link>
              </li>
              <li>
                <Link href="/cv.pdf" className="whitespace-nowrap font-bold">
                  CV / RESUME
                </Link>
              </li>
            </div>
          </ul>
        </nav>
      </div>
    </header>
  );
}
