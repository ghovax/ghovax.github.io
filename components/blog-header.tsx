"use client";

import Link from "next/link";
import { Linkedin, Mail } from "lucide-react";

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
      <div className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-2">
          <time className="text-sm text-muted-foreground font-medium">
            {today}
          </time>
        </div>
      </div>

      {/* Masthead & Bio */}
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="pb-6 text-left">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold tracking-tight">
              Giovanni Gravili
            </h1>
          </Link>
          <p className="text-xl text-muted-foreground pt-1 italic">
            R&D-Oriented Computational Physicist
          </p>
        </div>

        <div>
          <div className="max-w-4xl">
            <p className="text-base mb-4 leading-relaxed">
              As a computational physicist with a Master's in Material Physics and
              Nanoscience, I specialize in materials modeling, molecular
              dynamics, and machine learning. My recent work includes a thesis on
              nanoscale tribology using HPC, alongside leading technical
              development for an EdTech startup.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              I am passionate about connecting theory with practical application,
              from coding physical simulations to building software products and
              visualizing complex data. I am seeking research or industry roles
              where I can apply my programming and development skills to solve
              real-world problems in materials science.
            </p>
          </div>

          {/* Prominent CTA Buttons */}
          <div className="flex flex-wrap gap-3 my-6">
            <a
              href="https://drive.google.com/file/d/1G-KILQNpoLOk75gSCfRzYdH4CvNd1OFj/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity border-2 border-foreground"
            >
              View CV / Resume
            </a>
            <a
              href="https://github.com/ghovax"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border-2 border-foreground font-bold text-sm uppercase tracking-wide hover:bg-foreground hover:text-background transition-colors"
            >
              GitHub
            </a>
          </div>

          {/* Contact */}
          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com/in/giovanni-gravili"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs hover:opacity-70 transition-opacity"
            >
              <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
                <Linkedin className="w-4 h-4" />
              </span>
              LinkedIn
            </a>
            <a
              href="mailto:giovannigravili112@gmail.com"
              className="flex items-center gap-2 text-xs hover:opacity-70 transition-opacity"
            >
              <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </span>
              <span className="text-foreground font-mono">
                giovannigravili112@gmail.com
              </span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}