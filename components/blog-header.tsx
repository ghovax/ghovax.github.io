"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Linkedin } from "lucide-react";
import { Highlighter } from "./ui/highlighter";

export function BlogHeader() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="w-full">
      {/* Masthead & Bio */}
      <div className="max-w-6xl mx-auto px-4 pt-8 sm:pt-12">
        <div className="pb-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="flex-shrink-0">
            <Image
              src="/153454774.jpeg"
              alt="Giovanni Gravili"
              width={180}
              height={180}
              className="rounded-full border-2 border-border w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 object-contain"
              priority
            />
          </div>
          <div className="flex-1 text-center sm:text-left md:ml-2 sm:mt-5 md:mt-7">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Giovanni Gravili
              </h1>
            </Link>
            <p className="text-lg sm:text-xl text-muted-foreground pt-1 italic">
              R&D-Oriented Computational Physicist
            </p>
          </div>
        </div>

        <div>
          <div className="max-w-4xl">
            <p className="text-base mb-4 leading-relaxed">
              As a computational physicist with a Master's in Material Physics
              and Nanoscience, I specialize in materials modeling, molecular
              dynamics, and machine learning. My recent work includes a thesis
              on nanoscale tribology using HPC, alongside leading technical
              development for an EdTech startup project.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              I am passionate about connecting theory with practical
              application, from coding physical simulations to building software
              products and visualizing complex data. I am seeking research or
              industry roles where I can apply my programming and development
              skills to solve real-world problems in materials science,
              technology, education and adjacent fields.
            </p>
          </div>

          {/* Prominent CTA Buttons */}
          <div className="flex flex-wrap gap-3 my-6">
            <a
              href="https://drive.google.com/file/d/1yUgeBOnbC9-Zk6ECqg-7DrkrLLJFQHkF/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity border-2 border-foreground"
            >
              <Highlighter action="highlight" color="#32bc4dbb">
                View My CV / Resume
              </Highlighter>
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
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <a
              href="https://linkedin.com/in/giovanni-gravili"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs hover:opacity-70 transition-opacity"
            >
              <span className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
                <Linkedin className="w-4 h-4" />
              </span>
              <span className="text-sm">LinkedIn</span>
            </a>
            <a
              href="mailto:giovannigravili112@gmail.com"
              className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
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
