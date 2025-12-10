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
      <div className="max-w-6xl mx-auto px-4 pt-8 sm:pt-12 md:pt-16 lg:pt-20">
        <div className="pb-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="flex-shrink-0" style={{ boxShadow: "inset -10px -10px 10px 20px white" }}
          >
            <Image
              src="/153454774.jpeg"
              alt="Giovanni Gravili"
              width={180}
              height={180}
              className="rounded-xl border-1 border-foreground/30 w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 object-contain shadow-[0_0_30px_rgba(0,0,0,0.3)]"
              priority
            />
          </div>
          <div className="flex-1 text-center sm:text-left md:ml-4">
            <Link href="/" className="inline-block">
              <h1 className="text-[2rem] leading-[1.2] md:text-4xl font-bold tracking-tight">
                Giovanni Gravili
              </h1>
            </Link>
            <p className="text-lg sm:text-xl text-muted-foreground pt-1 italic">
              R&D-Oriented Computational Physicist
              <br />
              Full-Stack Developer
            </p>
          </div>
        </div>

        <div>
          <div className="max-w-4xl">
            <p className="text-base mb-4 mt-2 leading-relaxed">
              Master's Graduate in <i>Material Physics and Nanoscience</i> at the University of Bologna. My scientific expertise lies in materials modeling, molecular
              dynamics, nano-scale tribology, machine learning and data analysis. My technical abilities span among full-stack development, databases, cloud infrastructure, embedded systems and low-level languages.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Seeking research or
              industry roles to solve real-world problems in materials science,
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
