import Link from "next/link";

export function AboutSection() {
  return (
    <section id="skills" className="border-b border-border mb-6">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
      </div>
    </section>
  );
}