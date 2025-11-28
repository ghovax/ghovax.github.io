import Link from "next/link";

export function AboutSection() {
  return (
    <section id="about" className="border-b border-border py-8 mb-6">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Bio */}
          <div className="border-r-0 lg:border-r border-border lg:pr-8">
            <h2 className="text-2xl font-bold mb-4">Giovanni Gravili</h2>
            <p className="text-base mb-4 leading-relaxed">
              Computational physicist specializing in materials science and nanoscale simulations.
              Master's graduate from University of Bologna with expertise in HPC systems,
              molecular dynamics, and full-stack development.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Currently seeking research or industry roles combining computational methods
              with software engineering.
            </p>

            {/* Prominent CTA Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <a
                href="/cv.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity border-2 border-foreground"
              >
                View CV / Resume
              </a>
              <a
                href="https://github.com/yourusername"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border-2 border-foreground font-bold text-sm uppercase tracking-wide hover:bg-foreground hover:text-background transition-colors"
              >
                GitHub
              </a>
            </div>

            {/* Contact */}
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>
                <a href="https://linkedin.com/in/giovanni-gravili" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  linkedin.com/in/giovanni-gravili
                </a>
              </div>
              <div>
                <a href="mailto:giovannigravili112@gmail.com" className="hover:text-foreground">
                  giovannigravili112@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Right side - Skills & Quick Facts */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3 border-b border-border pb-1">
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
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3 border-b border-border pb-1">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 border border-border">Python</span>
                <span className="text-xs px-2 py-1 border border-border">C++</span>
                <span className="text-xs px-2 py-1 border border-border">TypeScript</span>
                <span className="text-xs px-2 py-1 border border-border">React</span>
                <span className="text-xs px-2 py-1 border border-border">VASP</span>
                <span className="text-xs px-2 py-1 border border-border">LAMMPS</span>
                <span className="text-xs px-2 py-1 border border-border">PyTorch</span>
                <span className="text-xs px-2 py-1 border border-border">Julia</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3 border-b border-border pb-1">
                Education
              </h3>
              <div className="text-xs space-y-2">
                <div>
                  <div className="font-medium">M.S. Material Physics & Nanoscience</div>
                  <div className="text-muted-foreground">University of Bologna, 2023–2025</div>
                </div>
                <div>
                  <div className="font-medium">B.S. Physics</div>
                  <div className="text-muted-foreground">University of Bologna, 2019–2023</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
