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
      <Marquee>
        {logos.map((logo) => (
          <div key={logo.name} className="mx-8">
            <img
              src={logo.src}
              alt={logo.name}
              className="h-12 w-auto filter invert"
            />
          </div>
        ))}
      </Marquee>
    </div>
  );
}
