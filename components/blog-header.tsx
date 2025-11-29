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
    <header className="w-full pt-8">
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
            Giovanni Gravili –{" "}
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
    </header>
  );
}
