To better learn PyTorch, I set out to develop an optimization program that combines the physics of lenses with machine learning. The goal is to design the shape of a single glass lens that takes a given bundle of parallel incoming light rays and focuses them to a single, theoretically infinitesimal point on a screen at a specified distance.

### Physics of Ray Optics

Because the apertures have diameters hundreds of times larger than the wavelength of light, we operate in the regime of geometrical optics, which treats light as rays. The underlying assumption is that light travels in straight lines within a uniform medium and that each ray is independent, with no interactions between rays. Wave effects such as diffraction and interference are neglected because the lens features are large compared with the wavelength. However, we will apply the full Snell’s law rather than the paraxial approximation, so the model remains accurate for rays at steep angles relative to the optical axis.

A light ray is mathematically represented by a vector with a given origin $\vec{P}_0$ and a normalized direction (unit length) $\vec{D}$. With the origin and direction fixed, the position along the ray can be parameterized by the distance $t$ traveled along its path:

$$\vec{P}(t) = \vec{P}_0 + t \vec{D} $$

Then, a lens, as in our case, is defined by two spherical surfaces: each specified by its curvature $c$. The curvature equals the reciprocal of the radius of curvature $R$, defined as $c=1/R$. Whenever the surface is flat, then $R=\infty$ and $c=0$. Under such formalism, the equation for a sphere with its center at $(0, 0, R)$ and with radius $R$ is:

$$x^2+y^2+(z-R)^2=R^2$$

Snell's law results from the experimental observation that whenever a ray of light passes from one medium to another with a different refractive index, it bends; this fundamental principle is what makes a lens work:

$$n_1 \sin(\theta_1) = n_2 \sin(\theta_2)$$

While this formula is correct, for a computational simulation, a vector-based representation is far more practical. Given an incident ray direction $\vec{D}_{inc}$ and the surface normal vector $\vec{N}$, the refracted direction $\vec{D}_{refr}$ can be calculated directly. Let $\mu = n_1/n_2$. The formula is:

$$ \vec{D}_{refr} = \mu \vec{D}_{inc} + \left(\mu \cos(\theta_1) - \cos(\theta_2)\right) \vec{N} $$

Here, the angles can be found using dot products: $\cos(\theta_1) = -\vec{D}_{inc} \cdot \vec{N}$. We can then find $\cos(\theta_2)$ using the trigonometric identity $\sin^2\theta + \cos^2\theta = 1$ and Snell's Law:

$$ \cos(\theta_2) = \sqrt{1 - \mu^2 (1 - \cos^2(\theta_1))} $$

A crucial edge case appears when the term inside this square root is negative. This happens when light travels from a denser to a less dense medium (e.g., from glass to air) at a shallow angle. This phenomenon is known as **Total Internal Reflection (TIR)**, where the ray reflects instead of refracting. Our model must consider these rays invalid, as they will not reach the target screen.

### The Computational Model: Tracing Rays

With the physics established, we can build a step-by-step algorithm to trace a ray's path. The first step is to determine precisely where a ray hits a lens surface. By substituting the ray's parametric equation into the sphere's equation, we arrive at a quadratic equation in terms of the distance $t$: $At^2 + Bt + C = 0$, where:

- $A = \vec{D} \cdot \vec{D} = 1$ (since the direction vector is normalized)
- $B = 2((\vec{P}_0 - \vec{C}_{sphere}) \cdot \vec{D})$
- $C = ||\vec{P}_0 - \vec{C}_{sphere}||^2 - R^2$

Solving for $t$ with the quadratic formula gives us the distance to the intersection point. The full algorithm for tracing a single ray through our lens is as follows:

1.  **Initialization**: Start with an initial ray, for instance, originating at $\vec{P}_0$ with direction $\vec{D}_0 = (0, 0, 1)$ for a collimated beam parallel to the z-axis.
2.  **First Surface Intersection**: Calculate the intersection point $\vec{P}_1$ of the ray with the first surface, $S_1$.
3.  **First Refraction**: At $\vec{P}_1$, calculate the surface normal $\vec{N}_1$ and apply the vector Snell's law to get the new ray direction, $\vec{D}_1$, as it enters the lens (with refractive index $n_{lens}$).
4.  **Second Surface Intersection**: Trace the new ray from $\vec{P}_1$ in direction $\vec{D}_1$ until it intersects the second surface, $S_2$, at point $\vec{P}_2$.
5.  **Second Refraction**: At $\vec{P}_2$, calculate the surface normal $\vec{N}_2$ and apply Snell's law again to find the final direction, $\vec{D}_2$, as the ray exits the lens back into the air ($n=1.0$).
6.  **Propagation to Target**: Propagate the final ray from $\vec{P}_2$ in direction $\vec{D}_2$ to the target plane at a fixed z-coordinate, $z_{target}$. This gives us the final coordinates $\vec{P}_{final}$ on the screen.

### Optimization with PyTorch

The beauty of this entire process is that it's just a chain of mathematical operations. By implementing this chain using PyTorch tensors, we create a **differentiable simulation**. This allows us to use gradient-based optimization to automatically find the best lens shape.

To do this, we need to define a **loss function**—a single number that quantifies how good our lens is. Since the goal is to focus all light to the origin $(0,0)$ on the target plane, a perfect metric is the average of the squared distances of each ray's final position from that origin. For $K$ rays, the loss $L$ for lens curvatures $c_1$ and $c_2$ is:

$$ L(c*1, c_2) = \frac{1}{K} \sum*{k=1}^{K} (x_k^2 + y_k^2) $$

This value is effectively the squared Root Mean Square (RMS) spot radius. Our goal is to find the $c_1$ and $c_2$ that minimize this value.

We declare the lens curvatures as `torch.nn.Parameter`, which tells PyTorch to track all operations involving them. The optimization then follows the standard machine learning loop:

1.  **Forward Pass**: Run the full ray-tracing simulation with the current lens curvatures to get the final positions of all rays on the target plane.
2.  **Calculate Loss**: Compute the loss using the formula above.
3.  **Backward Pass**: Call `loss.backward()`. PyTorch's `autograd` engine automatically computes the gradient of the loss with respect to our learnable parameters, $\frac{\partial L}{\partial c_1}$ and $\frac{\partial L}{\partial c_2}$. These gradients tell us how to adjust the curvatures to reduce the spot size.
4.  **Optimizer Step**: An optimizer, such as Adam or SGD, updates the curvatures in the direction opposite to the gradient, taking a small step to improve the lens.

By repeating this loop, the optimizer iteratively refining the lens shape, "walking" down the loss landscape until it discovers the curvatures that produce the sharpest possible focus. This approach elegantly merges the deterministic world of physics with the power of modern gradient-based optimization.
