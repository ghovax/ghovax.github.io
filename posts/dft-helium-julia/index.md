---
title: "Ground-State Energy via DFT for Helium"
date: "2025-11-27"
excerpt: "Implementation of ground-state energy of Helium atom computed via the Density Functional Theory (DFT) framework using Julia."
category: "Computational Physics"
tags: ["DFT", "Julia", "Quantum Mechanics", "Computational Physics"]
author: "Giovanni Gravili"
---

# Ground-State Energy via DFT for Helium

In this post, I'll walk you through my implementation of Density Functional Theory (DFT) to compute the ground-state energy of the Helium atom. This is a fascinating application of computational quantum mechanics that demonstrates how we can solve many-body problems using clever approximations and numerical methods.

## Introduction to the Problem

The Helium atom presents an interesting challenge in quantum mechanics. While we can solve the hydrogen atom exactly, adding just one more electron creates a many-body problem that requires approximations. The key difficulty is the electron-electron interaction term, which prevents us from separating the Schrödinger equation into independent single-particle equations.

The time-independent many-body Schrödinger equation for Helium is:

$$\hat{H}\Psi = E\Psi$$

where the Hamiltonian includes kinetic energy terms for both electrons, their attraction to the nucleus, and crucially, their mutual repulsion. This interaction term is what makes the problem intractable analytically.

## The DFT Approach: From Many-Body to Single-Particle

Density Functional Theory provides an elegant solution by reformulating the problem in terms of electron density rather than many-body wavefunctions. The key insight, formalized by Kohn and Sham, is that we can map the interacting many-electron system onto a system of non-interacting electrons moving in an effective potential.

### The Kohn-Sham Framework

In the Kohn-Sham approach, we write the total energy as:

$$E[n] = T_s[n] + E_{ext}[n] + E_H[n] + E_{xc}[n]$$

where:

- $T_s[n]$ is the kinetic energy of non-interacting electrons
- $E_{ext}[n]$ is the external potential energy (nuclear attraction)
- $E_H[n]$ is the Hartree energy (classical electron-electron repulsion)
- $E_{xc}[n]$ is the exchange-correlation energy (quantum many-body effects)

The beauty of this formulation is that all the complicated many-body physics gets packed into the exchange-correlation functional $E_{xc}[n]$, while the other terms can be computed straightforwardly.

### The Exchange-Correlation Functional

For the exchange-correlation energy, I use the Local Density Approximation (LDA) with the Perdew-Zunger parametrization. This is a well-established approximation that treats the electron gas locally as if it were uniform, with the exchange-correlation energy per particle depending only on the local density.

The LDA exchange-correlation energy is:

$$E_{xc}^{LDA}[n] = \int n(\mathbf{r})\epsilon_{xc}(n(\mathbf{r}))d\mathbf{r}$$

where $\epsilon_{xc}(n)$ is the exchange-correlation energy per particle of a uniform electron gas of density $n$.

## Exploiting Spherical Symmetry

For the Helium atom, we can exploit spherical symmetry to dramatically simplify the problem. The density depends only on the radial coordinate $r$, and the Kohn-Sham orbitals for the ground state are:

$$\psi(\mathbf{r}) = \frac{u(r)}{r}Y_0^0(\theta,\phi)$$

where $Y_0^0$ is the spherical harmonic for $l=m=0$, and $u(r)$ is the radial wavefunction.

This reduces our 3D problem to a 1D radial problem, which is much more tractable numerically.

## The Self-Consistent Field Method

The Kohn-Sham equations must be solved self-consistently because the effective potential depends on the density, which in turn depends on the orbitals we're trying to find. Here's the iterative procedure I implemented:

1. **Initialize**: Start with an initial guess for the density $n(r)$
2. **Compute potential**: Calculate the effective Kohn-Sham potential:
   $$V_{eff}(r) = V_{ext}(r) + V_H(r) + V_{xc}(r)$$
3. **Solve Kohn-Sham equation**: Find the orbital $u(r)$ that satisfies:
   $$-\frac{\hbar^2}{2m}\frac{d^2u}{dr^2} + V_{eff}(r)u(r) = Eu(r)$$
4. **Update density**: Compute new density from the orbital:
   $$n(r) = \frac{2}{4\pi r^2}\left|\frac{u(r)}{r}\right|^2$$
5. **Check convergence**: If the density has changed significantly, return to step 2
6. **Compute energy**: Once converged, calculate the total ground-state energy

The factor of 2 in the density comes from having two electrons with opposite spins in the same spatial orbital.

## Numerical Implementation

### Discretization and Finite Differences

I discretize the radial coordinate on a uniform grid with spacing $h$. For the second derivative in the radial Schrödinger equation, I use the three-point finite difference formula:

$$\frac{d^2u}{dr^2}\bigg|_{r_i} \approx \frac{u_{i+1} - 2u_i + u_{i-1}}{h^2}$$

This transforms our differential equation into a system of algebraic equations that we can solve numerically.

### The Shooting Method with Binary Search

To find the eigenvalue $E$ and eigenfunction $u(r)$ of the radial Schrödinger equation, I implemented a shooting method with binary search. The idea is simple but effective:

1. Guess an energy $E$
2. Integrate the Schrödinger equation outward from $r=0$ with the boundary condition $u(0)=0$
3. Check if the wavefunction has the correct asymptotic behavior (should decay to zero)
4. If the wavefunction is too large at large $r$, the energy guess was too low; if it oscillates or grows, the energy was too high
5. Use binary search to refine the energy guess until convergence

This method is robust and doesn't require solving large matrix eigenvalue problems.

### Computing the Hartree Potential

The Hartree potential represents the classical electrostatic repulsion between electrons. It satisfies Poisson's equation:

$$\nabla^2 V_H = -4\pi e^2 n(r)$$

In spherical coordinates, this becomes:

$$\frac{1}{r^2}\frac{d}{dr}\left(r^2\frac{dV_H}{dr}\right) = -4\pi e^2 n(r)$$

I solve this using finite differences with the boundary conditions $V_H(0)$ finite and $V_H(\infty) \to 0$.

### The Exchange-Correlation Potential

The exchange-correlation potential is obtained from the functional derivative of the exchange-correlation energy:

$$V_{xc}(r) = \frac{\delta E_{xc}}{\delta n(r)}$$

For the LDA with Perdew-Zunger parametrization, this can be computed analytically from the local density using the parametrized formulas for the uniform electron gas.

## Implementation Details in Julia

I chose Julia for this implementation because of its excellent performance for numerical computing and its clean, readable syntax. The code structure follows the self-consistent field algorithm outlined above.

Key implementation choices:

- **Atomic units**: I work in atomic units where $\hbar = m_e = e = 4\pi\epsilon_0 = 1$, which simplifies the equations considerably
- **Grid parameters**: I use a radial grid extending to $r_{max} = 20$ a.u. with typically 1000-2000 points
- **Convergence criteria**: The SCF loop continues until the change in total energy between iterations falls below a threshold (typically $10^{-6}$ a.u.)
- **Mixing scheme**: To improve convergence, I use simple linear mixing of the old and new densities: $n_{new} = \alpha n_{SCF} + (1-\alpha)n_{old}$ with mixing parameter $\alpha \approx 0.3$

## Results and Validation

After implementing the full self-consistent DFT calculation, I obtained the ground-state energy of Helium. The calculation converges in typically 15-25 iterations, depending on the initial guess and mixing parameter.

The final ground-state energy I computed is approximately **-2.86 Hartree** (in atomic units), which compares favorably with:

- Experimental value: -2.9037 Hartree
- Exact quantum mechanical result: -2.9037 Hartree (from variational calculations)

The small discrepancy is expected and comes from the approximations inherent in DFT, particularly the LDA for the exchange-correlation functional. For a two-electron system, LDA is not as accurate as it is for larger systems where correlation effects average out more.

### Radial Density and Orbital

The converged calculation also gives us the radial probability density and the Kohn-Sham orbital. These show the expected behavior:

- The density is peaked near the nucleus and decays exponentially
- The effective nuclear charge is partially screened by the electron-electron repulsion
- The radial orbital extends to about 2-3 Bohr radii before becoming negligible

## Reflections and Extensions

This implementation demonstrates several important concepts in computational quantum mechanics:

1. **The power of DFT**: We reduced a many-body problem to solving single-particle equations self-consistently
2. **Numerical methods**: Finite differences and shooting methods provide robust solutions even for challenging differential equations
3. **Self-consistency**: The iterative nature of the SCF method is central to mean-field theories in physics

Possible extensions of this work include:

- Implementing better exchange-correlation functionals (GGA, hybrid functionals)
- Extending to other atoms and ions
- Computing excited states and ionization energies
- Adding spin polarization for open-shell systems

## Interactive Implementation

Below is the interactive Pluto.jl notebook containing the full implementation where you can explore the code and modify parameters:

<iframe src="/.posts-build/dft-helium-julia/Important_story.html" width="100%" height="800px" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;"></iframe>

## Conclusion

Implementing DFT from scratch provides deep insight into how modern electronic structure calculations work. While production DFT codes use more sophisticated methods and functionals, the basic principles remain the same: map the many-body problem onto single-particle equations, solve them self-consistently, and approximate the exchange-correlation effects.

The fact that we can compute the ground-state energy of Helium to within a few percent accuracy using such a straightforward numerical implementation is a testament to the power and elegance of Density Functional Theory.

---

_The complete technical report with detailed equations and analysis is available [here](./dft_HeReport.pdf). For questions or discussions about this implementation, feel free to reach out._
