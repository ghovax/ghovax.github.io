import { MarqueeSection } from "./marquee";

export function AboutSection() {
  return (
    <section id="skills" className="border-b border-border mb-6">
      <div className="max-w-[1200px] mx-auto px-4 pb-12">
        <MarqueeSection />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Column 1: Programming & Development */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-border pb-1">
              Programming & Development
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Languages
                </h4>
                <p className="text-sm leading-relaxed flex flex-wrap items-center gap-1.5">
                  <span>Python</span>
                  <span className="text-muted-foreground">•</span>
                  <span>JavaScript/TypeScript</span>
                  <span className="text-muted-foreground">•</span>
                  <span>C++</span>
                  <span className="text-muted-foreground">•</span>
                  <span>FORTRAN</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Julia</span>
                  <span className="text-muted-foreground">•</span>
                  <span>MATLAB</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Mathematica</span>
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Frameworks & Libraries
                </h4>
                <p className="text-sm leading-relaxed flex flex-wrap items-center gap-1.5">
                  <span>React</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Next.js</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Node.js</span>
                  <span className="text-muted-foreground">•</span>
                  <span>REST APIs</span>
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Tools & Practices
                </h4>
                <p className="text-sm leading-relaxed flex flex-wrap items-center gap-1.5">
                  <span>Git/GitHub</span>
                  <span className="text-muted-foreground">•</span>
                  <span>CI/CD</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Embedded Systems</span>
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Cloud & DevOps
                </h4>
                <p className="text-sm leading-relaxed flex flex-wrap items-center gap-1.5">
                  <span>Google Cloud Storage (GCS)</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Firebase/Firestore</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Docker</span>
                  <span className="text-muted-foreground">•</span>
                  <span>MongoDB</span>
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Scientific Computing & Data Science */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-border pb-1">
              Scientific Computing
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Domains & Methods
                </h4>
                <p className="text-sm leading-relaxed flex flex-wrap items-center gap-1.5">
                  <span>Computational Materials Science</span>
                  <span className="text-muted-foreground">•</span>
                  <span>HPC</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Numerical Analysis</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Molecular Dynamics</span>
                  <span className="text-muted-foreground">•</span>
                  <span>DFT</span>
                  <span className="text-muted-foreground">•</span>
                  <span>ML-based Force Fields</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Multiscale Simulations</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Nanoscale Tribology</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Large-Scale Data Pipelines</span>
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Software & Libraries
                </h4>
                <p className="text-sm leading-relaxed flex flex-wrap items-center gap-1.5">
                  <span>VASP</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Quantum ESPRESSO</span>
                  <span className="text-muted-foreground">•</span>
                  <span>LAMMPS</span>
                  <span className="text-muted-foreground">•</span>
                  <span>OVITO</span>
                  <span className="text-muted-foreground">•</span>
                  <span>ASE</span>
                  <span className="text-muted-foreground">•</span>
                  <span>TensorFlow</span>
                  <span className="text-muted-foreground">•</span>
                  <span>PyTorch</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Scikit-Learn</span>
                  <span className="text-muted-foreground">•</span>
                  <span>NumPy</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Pandas</span>
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Experimental Techniques
                </h4>
                <p className="text-sm leading-relaxed flex flex-wrap items-center gap-1.5">
                  <span>X-ray</span>
                  <span className="text-muted-foreground">•</span>
                  <span>AFM/STM</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Spectroscopy (Raman, IR, UV-Vis, NQR)</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Photoluminescence</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Nano-electronics</span>
                </p>
              </div>
            </div>
          </div>

          {/* Column 3: Education & Skills */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-border pb-1">
              Education & Skills
            </h3>
            <div className="space-y-4">
              <div>
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

              <div>
                <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Soft Skills
                </h4>
                <p className="text-sm leading-relaxed flex flex-wrap items-center gap-1.5">
                  <span>Adaptability</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Teamwork</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Robust Code Practices</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Communication</span>
                  <span className="text-muted-foreground">•</span>
                  <span>Fast Learning</span>
                </p>
              </div>
            </div>
          </div>
        </div>      </div>
    </section>
  );
}
