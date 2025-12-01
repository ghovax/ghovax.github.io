"use client";

import Marquee from "react-fast-marquee";

const logos = [
  // Scientific Computing
  { name: "VASP", src: "/logos/vasp-logo.png" },
  { name: "LAMMPS", src: "/logos/ISV-OSS-Non-Nvidia-Publishing-Lammps.png" },
  { name: "Quantum ESPRESSO", src: "/logos/Quantum-ESPRESSO-LOGO-NEW.png" },
  { name: "OVITO", src: "/logos/ovito_logo_256.BAk4uGrH.png" },
  // Software Engineering
  { name: "React", src: "/logos/React-icon.svg.png" },
  { name: "Next.js", src: "/logos/Nextjs-logo.svg.png" },
  { name: "Node.js", src: "/logos/Node.js_logo.svg.png" },
  { name: "TypeScript", src: "/logos/Typescript_logo_2020.svg.png" },
  { name: "JavaScript", src: "/logos/Unofficial_JavaScript_logo_2.svg.png" },
  { name: "Docker", src: "/logos/Docker_Logo.png" },
  { name: "Git", src: "/logos/Git-logo.svg.png" },
  { name: "Google Cloud", src: "/logos/google-cloud.png" },
  { name: "Firebase", src: "/logos/New_Firebase_logo.svg.png" },
  // Machine Learning
  { name: "PyTorch", src: "/logos/PyTorch_logo_black.svg.png" },
  { name: "TensorFlow", src: "/logos/TensorFlow_logo.svg.png" },
  { name: "Scikit-Learn", src: "/logos/Scikit_learn_logo_small.svg.png" },
  { name: "Pandas", src: "/logos/Pandas_logo.svg.png" },
  { name: "NumPy", src: "/logos/NumPy_logo_2020.svg.png" },
];

export function MarqueeSection() {
  return (
    <div className="py-12">
      <Marquee className="overflow-y-hidden" autoFill>
        {logos.map((logo) => (
          <div key={logo.name} className="mx-4 md:mx-7 my-4">
            <img
              src={logo.src}
              alt={logo.name}
              className="w-auto h-12"
              style={
                logo.name === "LAMMPS"
                  ? { transform: "scale(2.5)", margin: "0 1.5rem 0 1rem" }
                  : logo.name === "Next.js"
                    ? { transform: "scale(0.7)" }
                    : logo.name == "Quantum ESPRESSO"
                      ? { transform: "scale(2)", margin: "0 0.75rem" }
                      : logo.name == "Google Cloud"
                        ? { transform: "scale(1.5)" }
                        : logo.name == "TensorFlow"
                          ? { transform: "scale(1.75)" }
                          : logo.name == "PyTorch"
                            ? { transform: "scale(0.85)" }
                            : logo.name == "Firebase"
                              ? { margin: "0 -0rem 0 0rem" }
                              : {}
              }
            />
          </div>
        ))}
      </Marquee>
    </div>
  );
}
