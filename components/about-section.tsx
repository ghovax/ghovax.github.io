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
                          <p className="text-sm leading-relaxed">
                            Python, JavaScript/TypeScript, C++, FORTRAN, Julia, MATLAB, Mathematica
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Frameworks & Libraries
                          </h4>
                          <p className="text-sm leading-relaxed">
                            React, Next.js, Node.js, REST APIs
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Tools & Practices
                          </h4>
                          <p className="text-sm leading-relaxed">
                            Git/GitHub, CI/CD, Embedded Systems
                          </p>
                        </div>
                      </div>
                    </div>
        
                    {/* Column 2: Scientific Computing & Data Science */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold uppercase tracking-wide mb-3 border-b border-border pb-1">
                        Scientific Computing & Data Science
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Domains & Methods
                          </h4>
                          <p className="text-sm leading-relaxed">
                            Computational Materials Science, HPC, Numerical Analysis, Molecular Dynamics, DFT, ML-based Force Fields, Multiscale Simulations, Nanoscale Tribology, Large-Scale Data Pipelines
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Software & Libraries
                          </h4>
                          <p className="text-sm leading-relaxed">
                            VASP, Quantum ESPRESSO, LAMMPS, OVITO, ASE, TensorFlow, PyTorch, Scikit-Learn, NumPy, Pandas
                          </p>
                        </div>
                      </div>
                    </div>
        
                    {/* Column 3: Education & Other */}
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
                        {/* Adding Cloud & Experimental Techniques here as a sub-section to fit into 3 columns*/}
                        <div>
                          <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Cloud & DevOps
                          </h4>
                          <p className="text-sm leading-relaxed">
                            Google Cloud Storage (GCS), Firebase/Firestore, Docker, MongoDB
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Experimental & Analytical Techniques
                          </h4>
                          <p className="text-sm leading-relaxed">
                            X-ray, AFM/STM, Spectroscopy (Raman, IR, UV-Vis, NQR), Photoluminescence, Nano-electronics
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Professional & Soft Skills
                          </h4>
                          <p className="text-sm leading-relaxed">
                            Adaptability, Teamwork, Robust Code, Communication, Problem-Solving
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>      </div>
    </section>
  );
}
