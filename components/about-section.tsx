import { MarqueeSection } from "./marquee";

export function AboutSection() {
  return (
    <section id="skills" className="border-b border-border mb-6">
      <div className="max-w-[1200px] mx-auto px-4 pb-12">
        <MarqueeSection />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Column 1: Scientific Computing */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-border pb-1">
              Scientific Computing
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Domains
                </h4>
                <p className="text-sm leading-relaxed">
                  Computational Physics, HPC, Numerical Analysis
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Software Engineering */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-border pb-1">
              Software Engineering
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Domains
                </h4>
                <p className="text-sm leading-relaxed">
                  Full-Stack Development, Embedded Systems
                </p>
              </div>
            </div>
          </div>

          {/* Column 3: Machine Learning & Education */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-border pb-1">
              Education
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Education
                </h4>
                <div className="text-sm space-y-2">
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
        </div>
      </div>
    </section>
  );
}
