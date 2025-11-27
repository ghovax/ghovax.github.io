---
title: "Ground-State Energy via DFT for Helium"
date: "2025-11-27"
excerpt: "Implementation of ground-state energy of Helium atom computed via the Density Functional Theory (DFT) framework using Julia."
category: "Computational Physics"
tags: ["DFT", "Julia", "Quantum Mechanics", "Computational Physics"]
author: "Giovanni Gravili"
---

# Ground-State Energy via DFT for Helium

This post presents an implementation of the ground-state energy of the Helium atom computed using the Density Functional Theory (DFT) framework in Julia.

## Overview

Density Functional Theory (DFT) is a computational quantum mechanical modelling method used to investigate the electronic structure of many-body systems. In this implementation, we use the Kohn-Sham approach with Local Density Approximation (LDA) and the Perdew-Zunger correlation functional.

## Interactive Pluto Notebook

Below is the interactive Pluto.jl notebook containing the full implementation:

<iframe src="/.posts-build/dft-helium-julia/Important_story.html" width="100%" height="800px" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;"></iframe>

## Detailed Report

The complete analysis and results are available in the detailed report below:

<iframe src="/.posts-build/dft-helium-julia/dft_HeReport.html" width="100%" height="600px" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;"></iframe>

## Key Features

- **Self-consistent Kohn-Sham DFT** calculation
- **LDA with Perdew-Zunger** correlation functional
- **Finite difference methods** for radial Schrödinger and Poisson equations
- **Shooting method with binary search** for eigenvalue determination

## Results

The implementation successfully computes the ground-state energy of the Helium atom, demonstrating the power and accuracy of DFT methods for atomic systems.

---

*For questions or discussions about this implementation, feel free to reach out.*
