---
title: "Ground-State Energy via DFT for Helium"
date: "2025-11-27"
excerpt: "Implementation of ground-state energy of Helium atom computed via the Density Functional Theory (DFT) framework using Julia."
category: "Computational Physics"
tags: ["DFT", "Julia", "Quantum Mechanics", "Computational Physics"]
author: "Giovanni Gravili"
---

In this post, I'll walk you through my implementation of Density Functional Theory (DFT) to compute the ground-state energy of the Helium atom. This project taught me not only about the mathematical foundations of DFT but also about the practical challenges of implementing self-consistent field methods and solving coupled differential equations numerically.

The Helium atom presents an interesting challenge in quantum mechanics. While we can solve the hydrogen atom exactly using separation of variables, adding just one more electron creates a many-body problem that requires approximations. The key difficulty is the electron-electron interaction term, which prevents us from separating the Schrödinger equation into independent single-particle equations.

The time-independent many-body Schrödinger equation for Helium is:

$$\hat{H}\Psi = E\Psi$$

where the Hamiltonian includes kinetic energy terms for both electrons, their attraction to the nucleus, and crucially, their mutual repulsion. This interaction term couples the motion of the two electrons in a way that makes analytical solutions impossible. Writing out the Hamiltonian explicitly:

$$\hat{H} = -\frac{\hbar^2}{2m}(\nabla_1^2 + \nabla_2^2) - \frac{Ze^2}{r_1} - \frac{Ze^2}{r_2} + \frac{e^2}{|\mathbf{r}_1 - \mathbf{r}_2|}$$

That last term, $\frac{e^2}{|\mathbf{r}_1 - \mathbf{r}_2|}$, is what makes everything difficult. It means we can't write the wavefunction as a simple product of single-electron wavefunctions. The electrons are correlated: knowing where one electron is affects the probability distribution of the other.

# Interactive Implementation

Below is the interactive Pluto.jl notebook containing the full implementation where you can explore the code, modify parameters, and see how the calculation responds:

<iframe src="/.posts-build/dft-helium-julia/Important_story.html" width="100%" height="800px" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;"></iframe>

# The DFT Approach

Density Functional Theory provides an elegant solution by reformulating the problem in terms of electron density $n(\mathbf{r})$ rather than many-body wavefunctions $\Psi(\mathbf{r}_1, \mathbf{r}_2, ..., \mathbf{r}_N)$. The key insight, formalized by Kohn and Sham in 1965, is that we can map the interacting many-electron system onto a system of non-interacting electrons moving in an effective potential.

This is profound: instead of tracking the 6N-dimensional wavefunction for N electrons (3 spatial coordinates times 2 for spin), we only need to track the 3-dimensional density function. For Helium with spherical symmetry, this becomes just a 1-dimensional radial function.

In the Kohn-Sham approach, we write the total energy as a functional of the density:

$$E[n] = T_s[n] + E_{ext}[n] + E_H[n] + E_{xc}[n]$$

where $T_s[n]$ is the kinetic energy of non-interacting electrons, $E_{ext}[n]$ is the external potential energy (nuclear attraction), $E_H[n]$ is the Hartree energy (classical electron-electron repulsion), and $E_{xc}[n]$ is the exchange-correlation energy (quantum many-body effects).

Let me break down what each term represents physically. The kinetic energy $T_s[n]$ is the energy associated with the motion of electrons. In the Kohn-Sham scheme, we compute this from fictitious non-interacting electrons that have the same density as the real system. The external potential $E_{ext}[n] = \int V_{ext}(\mathbf{r})n(\mathbf{r})d\mathbf{r}$ represents the attraction between electrons and the nucleus. For a nuclear charge Z, this is $V_{ext}(\mathbf{r}) = -Ze^2/r$.

The Hartree energy captures the classical electrostatic repulsion between the electron cloud and itself. If you imagine the electrons as a continuous charge distribution, this is just the Coulomb energy of that distribution:

$$E_H[n] = \frac{e^2}{2}\int\int\frac{n(\mathbf{r})n(\mathbf{r}')}{|\mathbf{r}-\mathbf{r}'|}d\mathbf{r}d\mathbf{r}'$$

The beauty of this formulation is that all the complicated many-body physics gets packed into the exchange-correlation functional $E_{xc}[n]$. Exchange interactions from the Pauli exclusion principle and correlation effects from the actual electron-electron interactions all live here. This is the unknown part that we must approximate.

For the exchange-correlation energy, I use the Local Density Approximation (LDA) with the Perdew-Zunger parametrization. This approximation treats the electron gas locally as if it were uniform, with the exchange-correlation energy per particle depending only on the local density. The key assumption is that at each point in space, the exchange-correlation energy is approximately what it would be for a uniform gas with that local density. This works surprisingly well, especially for systems where the density varies slowly. For atoms like Helium, it's less accurate but still gives reasonable results.

# Exploiting Spherical Symmetry

For the Helium atom in its ground state, we can exploit spherical symmetry to dramatically simplify the problem. The density depends only on the radial coordinate $r$, not on the angular coordinates $\theta$ and $\phi$.

The Kohn-Sham orbitals for the ground state (both electrons in the 1s orbital) are:

$$\psi(\mathbf{r}) = \frac{u(r)}{r}Y_0^0(\theta,\phi)$$

where $Y_0^0 = \frac{1}{\sqrt{4\pi}}$ is the spherical harmonic for $l=m=0$, and $u(r)$ is the radial wavefunction we need to find. The normalization condition becomes:

$$\int|\psi(\mathbf{r})|^2d\mathbf{r} = \int_0^\infty u^2(r)dr = 1$$

This is much simpler than the full 3D normalization integral. The electron density is then:

$$n(r) = \frac{2}{4\pi r^2}\left|\frac{u(r)}{r}\right|^2 = \frac{2u^2(r)}{4\pi r^2}$$

where the factor of 2 accounts for two electrons with opposite spins occupying the same spatial orbital. This reduces our 3D problem to a 1D radial problem, which is much more tractable numerically.

# The Self-Consistent Field Method

The Kohn-Sham equations must be solved self-consistently because the effective potential depends on the density, which in turn depends on the orbitals we're trying to find. This creates a circular dependency that we resolve through iteration.

Here's the iterative procedure I implemented:

1. Start with an initial guess for the density $n(r)$. I typically use an exponential decay $n(r) = n_0 e^{-\alpha r}$ or the density from a hydrogen-like atom.

2. Calculate the effective Kohn-Sham potential: $V_{eff}(r) = V_{ext}(r) + V_H(r) + V_{xc}(r)$, where $V_{ext}(r) = -Ze^2/r$ is the nuclear attraction, $V_H(r)$ is obtained by solving Poisson's equation with the current density, and $V_{xc}(r) = \frac{\delta E_{xc}}{\delta n}$ is the functional derivative of the exchange-correlation energy.

3. Find the orbital $u(r)$ and energy eigenvalue $E$ that satisfy: $-\frac{\hbar^2}{2m}\frac{d^2u}{dr^2} + V_{eff}(r)u(r) = Eu(r)$. This is a 1D Schrödinger equation with an effective potential.

4. Compute new density from the orbital: $n(r) = \frac{2}{4\pi r^2}\left|\frac{u(r)}{r}\right|^2$.

5. Compare the new density (or total energy) with the previous iteration. If the change is below a threshold (I use $10^{-6}$ atomic units), we've converged. Otherwise, return to step 2.

6. Once converged, calculate the ground-state energy using: $E_{total} = T_s + E_{ext} + E_H + E_{xc}$.

One key lesson I learned is the importance of mixing in step 4. If you simply replace the old density with the new one, the iterations often diverge or oscillate. Instead, I use linear mixing:

$$n_{input}^{(i+1)} = \alpha n_{output}^{(i)} + (1-\alpha)n_{input}^{(i)}$$

where $\alpha \approx 0.3$ is a mixing parameter. This damps oscillations and helps convergence. Finding the right mixing parameter was crucial for getting stable iterations.

# Numerical Implementation

I discretize the radial coordinate on a uniform grid: $r_i = i \cdot h$ for $i = 0, 1, 2, ..., N$, where $h$ is the grid spacing. Typically I use $h \approx 0.01$ atomic units and extend the grid to $r_{max} = 20$ atomic units. For the second derivative in the radial Schrödinger equation, I use the three-point finite difference formula:

$$\frac{d^2u}{dr^2}\bigg|_{r_i} \approx \frac{u_{i+1} - 2u_i + u_{i-1}}{h^2}$$

This approximation has an error that scales as $O(h^2)$, which is acceptable for our purposes. With $h = 0.01$, the discretization error is about $10^{-4}$, much smaller than the error from the LDA approximation. The Schrödinger equation then becomes a system of algebraic equations that can be solved using various methods.

To find the eigenvalue $E$ and eigenfunction $u(r)$ of the radial Schrödinger equation, I implemented a shooting method combined with binary search. This was one of the most satisfying parts of the project to implement. The idea is simple but effective. I guess an energy $E$ within some range (I start with $[-10, 0]$ Hartree for the ground state), integrate outward from $r=0$ using the finite difference equation with boundary conditions $u(0) = 0$ and $u(h) = h$, and check the asymptotic behavior. At large $r$, the correct eigenfunction should decay exponentially to zero. If the energy guess is wrong, the wavefunction either decays too quickly and diverges negative (energy too low) or oscillates and grows (energy too high). I use bisection to narrow the energy range until I hit the eigenvalue within tolerance $10^{-6}$ Hartree. This method is robust because it's guaranteed to converge.

The Hartree potential represents the classical electrostatic repulsion between electrons. It satisfies Poisson's equation:

$$\nabla^2 V_H = -4\pi e^2 n(r)$$

In spherical coordinates with spherical symmetry, this becomes:

$$\frac{1}{r^2}\frac{d}{dr}\left(r^2\frac{dV_H}{dr}\right) = -4\pi e^2 n(r)$$

To solve this, I integrate twice. First, I define $\chi(r) = r^2\frac{dV_H}{dr}$ and integrate $\frac{d\chi}{dr} = -4\pi e^2 r^2 n(r)$ from $r=0$ outward to get $\chi(r)$, with the boundary condition $\chi(0) = 0$. Then I integrate $\frac{dV_H}{dr} = \frac{\chi(r)}{r^2}$ to get $V_H(r)$, using the boundary condition that $V_H(\infty) \to 0$. In practice, I integrate backward from $r_{max}$ where I set $V_H(r_{max}) = Q_{total}/r_{max}$.

This two-step integration process was tricky to implement correctly. Initially, I had stability issues with the $1/r^2$ term, which I resolved by treating the small-$r$ region carefully and using the analytical behavior near the origin.

I chose Julia for this implementation because of its excellent performance for numerical computing and its clean, readable syntax that looks very similar to mathematical notation. The code structure follows the self-consistent field algorithm outlined above. I work in atomic units where $\hbar = m_e = e = 4\pi\epsilon_0 = 1$. This simplifies the equations considerably. The unit of energy is $1~\text{Hartree}\approx 27.2$ eV, and the unit of length is $1~\text{Bohr}\approx 0.529$ Å.

I use a radial grid extending to $r_{max} = 20$ a.u. with 2000 points, giving $h = 0.01$ a.u. This is fine enough to resolve the wavefunction accurately (which has characteristic length scale $\sim 1~\text{Bohr}$ for Helium) while keeping computation fast. The SCF loop continues until the change in total energy between iterations falls below $10^{-6}$ a.u. (about 0.03 meV). After much experimentation, I found that simple linear mixing with $\alpha = 0.3$ works well. Too large $\alpha$ causes oscillations; too small makes convergence very slow. I start with a hydrogen-like density $n(r) = \frac{Z^3}{\pi}e^{-2Zr}$, which is a reasonable first approximation. The SCF typically converges in 15-25 iterations from this starting point.

One of the key things I learned during implementation was the importance of numerical stability. Several places in the code require careful handling of division by $r^2$ or $r$ when $r$ is small, exponential functions that can overflow, normalization of wavefunctions on discrete grids, and integration near boundaries. I handled these through careful treatment of boundary conditions and using stable numerical algorithms (like the shooting method which naturally handles the $r=0$ singularity).

# Results and Validation

After implementing the full self-consistent DFT calculation, I obtained the ground-state energy of Helium. The calculation typically converges in 15-25 iterations depending on the initial guess and mixing parameter. Watching the energy converge iteration by iteration was deeply satisfying.

The final ground-state energy I computed is approximately **-2.86 Hartree** (in atomic units), which compares with the experimental value of $-2.9037$ Hartree and the exact quantum mechanical result of $-2.9037$ Hartree (from high-accuracy variational calculations). My error is $\sim 1.5\%$ or $0.04$ Hartree (about 1 eV).

The small discrepancy is expected and comes primarily from the approximations inherent in DFT, particularly the LDA for the exchange-correlation functional. For a two-electron system like Helium, LDA systematically underestimates the magnitude of the correlation energy. The LDA works best for systems where the electron density varies slowly, which isn't really true for small atoms. Despite this limitation, getting to within 1.5% of the exact answer using such a conceptually simple approach is remarkable.

Breaking down the total energy into components was enlightening. The kinetic energy is about $+2.5$ Hartree (positive, as expected), the nuclear attraction is about $-6.7$ Hartree (large negative contribution), the Hartree energy is about $+1.6$ Hartree (electron-electron repulsion), and the exchange-correlation is about $-0.3$ Hartree (quantum corrections). The interplay between these terms is fascinating. The nuclear attraction tries to pull electrons in, but this is balanced by kinetic energy (uncertainty principle: confining electrons increases their kinetic energy) and Hartree repulsion. The exchange-correlation term, though smallest in magnitude, is crucial for accuracy.

The converged calculation also gives us the radial probability density and the Kohn-Sham orbital. These show the expected physical behavior. The density is peaked near the nucleus (around $r \approx 0.3$ a.u.) and decays exponentially. The effective nuclear charge seen by the electrons is partially screened by electron-electron repulsion: instead of seeing the full $Z=2$ charge, each electron sees something closer to $Z\approx 1.7$. The radial orbital extends to about 2-3 Bohr radii before becoming negligible. The density is slightly more diffuse than in hydrogen-like atoms due to electron-electron repulsion.

Plotting these functions and seeing them emerge from the self-consistent calculation was one of the most rewarding parts of the project. These aren't input, they're the natural solution that the equations find.

# What I Learned

This project taught me several important lessons about computational quantum mechanics and scientific computing.

DFT shows how a clever reformulation can make an intractable problem solvable. We didn't solve the full many-body problem, we replaced it with an equivalent single-particle problem in an effective potential. The LDA works remarkably well for many systems, but its limitations are clear for small atoms. Understanding when approximations break down is as important as knowing when they work. The circular dependency between density and potential means convergence isn't guaranteed. Mixing schemes and careful initialization are essential.

The shooting method with binary search is conceptually simple but robust. Sometimes straightforward approaches are better than sophisticated ones. Much of the implementation effort went into correctly handling boundaries at $r=0$, at $r=\infty$, in differential equations, in integrations. Getting these right is crucial. Finer grids give better accuracy but slower computation. Finding the right balance required experimentation and convergence testing.

Division by small numbers, exponentials, singularities all required special handling. Robust code needs more than just correct algorithms. I checked my results against known values, tested limiting cases (like Z=1 should give hydrogen), and verified that energy components had reasonable magnitudes. Trust, but verify. The combination of clean syntax, good performance, and easy vectorization in Julia made implementation straightforward. I could focus on the physics rather than fighting the language.

# Extensions

Looking back, implementing DFT from scratch provided deep insight into how modern electronic structure calculations work. While production DFT codes use more sophisticated methods (plane-wave basis sets, pseudopotentials, advanced functionals), the basic principles remain the same: map the many-body problem onto single-particle equations, solve them self-consistently, and approximate the exchange-correlation effects.

Several extensions would be interesting to pursue. Implementing GGA (Generalized Gradient Approximation) functionals like PBE would improve accuracy. These depend on both density and its gradient, capturing more physics. The code could easily be adapted to other spherically symmetric atoms (Li, Be, etc.) or ions. It would be interesting to see how the LDA error scales with atomic number. By computing the energy of He and He$^+$, I could calculate the first ionization energy and compare with experiment (24.6 eV).

Extending to excited states would require solving for higher eigenvalues of the Kohn-Sham equation. Time-dependent DFT (TDDFT) is the proper framework for this. For open-shell systems, we'd need spin-dependent densities $n_\uparrow(r)$ and $n_\downarrow(r)$, leading to spin-polarized DFT. Molecules require handling non-spherical geometries, which means moving to 3D grids or basis set expansions. This dramatically increases complexity. DFT has known limitations for certain properties. Methods like GW (for bandgaps) or quantum Monte Carlo (for high accuracy) could be explored.

---

Implementing DFT from scratch has been one of my most educational projects. It bridges abstract quantum mechanics with practical computation, requiring both theoretical understanding and numerical skills. The journey from the many-body Schrödinger equation to a converged ground-state energy involves many steps: reformulating the problem using DFT, exploiting symmetries, discretizing differential equations, implementing self-consistent iteration, and carefully handling numerical issues. Each step taught me something new.

The fact that we can compute the ground-state energy of Helium to within 1.5% accuracy using such a relatively straightforward numerical implementation is a testament to the power and elegance of Density Functional Theory. It's no wonder that DFT has become the workhorse of computational chemistry and materials science. More importantly, working through the details of this implementation gave me deep appreciation for the computational quantum mechanics that underlies much of modern science and technology, from drug design to battery development to understanding catalysis. The equations I implemented here, scaled up and optimized, are running on supercomputers around the world right now, helping scientists design new materials and understand complex molecules.