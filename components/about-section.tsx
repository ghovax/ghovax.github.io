import Link from "next/link";
import { Linkedin, Mail } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="border-b border-border py-8 mb-6">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Skills & Expertise */}
          <div className="border-r-0 lg:border-r border-border lg:pr-8 space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-border pb-0.5">
                Core Expertise
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="font-medium">Computational Physics</div>
                <div className="font-medium">Full-Stack Development</div>
                <div className="font-medium">Machine Learning</div>
                <div className="font-medium">HPC & Data Analysis</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-border pb-0.5">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 border border-border">
                  Python
                </span>
                <span className="text-xs px-2 py-1 border border-border">
                  C++
                </span>
                <span className="text-xs px-2 py-1 border border-border">
                  TypeScript
                </span>
                <span className="text-xs px-2 py-1 border border-border">
                  React
                </span>
                <span className="text-xs px-2 py-1 border border-border">
                  VASP
                </span>
                <span className="text-xs px-2 py-1 border border-border">
                  LAMMPS
                </span>
                <span className="text-xs px-2 py-1 border border-border">
                  PyTorch
                </span>
                <span className="text-xs px-2 py-1 border border-border">
                  Julia
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-border pb-0.5">
                Education
              </h3>
              <div className="text-[0.8125rem] space-y-2">
                <div>
                  <div className="font-medium">
                    M.Sc. Material Physics & Nanoscience
                  </div>
                  <div className="text-xs text-muted-foreground">
                    University of Bologna, 2023–2025
                  </div>
                </div>
                <div>
                  <div className="font-medium">B.Sc. Physics</div>
                  <div className="text-xs text-muted-foreground">
                    University of Bologna, 2019–2023
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Bio & Contact */}
          <div>
            <p className="text-base mb-4 leading-relaxed">
              Computational physicist with proven expertise in materials science,
              HPC systems, and full-stack development. Delivered high-impact
              research in nanoscale simulations and molecular dynamics, with
              hands-on experience in production-grade scientific software and
              modern web technologies.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Seeking opportunities to apply computational methods and software
              engineering skills to solve complex technical challenges. Proven
              ability to bridge theoretical research with practical
              implementation. Available for remote work and open to relocation.
            </p>

            {/* Prominent CTA Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
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
                <span className="text-foreground font-mono">giovannigravili112@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
