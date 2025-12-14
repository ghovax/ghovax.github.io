To better learn PyTorch, I set out to develop an optimization program that combines the physics of lenses with machine learning. The goal is to design the shape of a single glass lens that takes a given bundle of parallel incoming light rays and focuses them to a single, theoretically infinitesimal point on a screen at a specified distance.

### Physics of Ray Optics

Because the apertures have diameters hundreds of times larger than the wavelength of light, we operate in the regime of geometrical optics, which treats light as rays. The underlying assumption is that light travels in straight lines within a uniform medium and that each ray is independent, with no interactions between rays. Wave effects such as diffraction and interference are neglected because the lens features are large compared with the wavelength. However, we will apply the full Snell's law rather than the paraxial approximation, so the model remains accurate for rays at steep angles relative to the optical axis.

#### Parametric Ray Representation

A light ray is mathematically represented by a vector with a given origin $\vec{P}_0 = (x_0, y_0, z_0)$ and a normalized direction (unit length) $\vec{D} = (D_x, D_y, D_z)$ where $|\vec{D}| = 1$. With the origin and direction fixed, the position along the ray can be parameterized by the distance $t$ traveled along its path:

$$\vec{P}(t) = \vec{P}_0 + t \vec{D}$$

This parametric form is computationally convenient because finding where a ray intersects a surface reduces to solving for the scalar $t$.

#### Spherical Surface Geometry

A lens, as in our case, is defined by two spherical surfaces, each specified by its curvature $c$. The curvature equals the reciprocal of the radius of curvature $R$, defined as $c=1/R$. Whenever the surface is flat, then $R=\infty$ and $c=0$. The sign convention is crucial: a positive curvature means the center of curvature lies in the $+z$ direction from the surface vertex, creating a convex surface for incoming rays.

For a sphere with its center at $(0, 0, R)$ and with radius $R$, the implicit equation is:

$$x^2+y^2+(z-R)^2=R^2$$

Expanding and simplifying: $x^2 + y^2 + z^2 - 2zR = 0$. Solving for $z$ gives the **sag** (the z-displacement from the vertex at the origin):

$$z = R - \sqrt{R^2 - r^2}$$

where $r^2 = x^2 + y^2$ is the squared radial distance from the optical axis. This can be rewritten in terms of curvature $c = 1/R$:

$$z = \frac{1}{c}\left(1 - \sqrt{1 - c^2 r^2}\right)$$

To avoid numerical instability when $c \to 0$, we rationalize by multiplying by $\frac{1 + \sqrt{1 - c^2 r^2}}{1 + \sqrt{1 - c^2 r^2}}$:

$$z = \frac{c r^2}{1 + \sqrt{1 - c^2 r^2}}$$

This is the **non-paraxial sag formula**, valid for all ray heights. The paraxial approximation $z \approx \frac{c r^2}{2}$ is only accurate for small $r$.

#### Surface Normals

To apply Snell's law, we need the surface normal at each intersection point. For a sphere centered at $\vec{C} = (0, 0, 1/c)$, the outward normal at any point $\vec{P}$ on the surface is simply the normalized vector from the center to that point:

$$\vec{N} = \frac{\vec{P} - \vec{C}}{|\vec{P} - \vec{C}|} = \frac{\vec{P} - \vec{C}}{R}$$

In component form, if $\vec{P} = (x, y, z)$ and the surface vertex is at the origin:

$$\vec{N} = \frac{1}{R}(x, y, z - R) = (cx, cy, cz - 1)$$

after normalization. The sign of the normal determines which direction is "into" vs. "out of" the lens material.

#### Vector Form of Snell's Law

Snell's law results from the experimental observation that whenever a ray of light passes from one medium to another with a different refractive index, it bends:

$$n_1 \sin(\theta_1) = n_2 \sin(\theta_2)$$

While this scalar formula is correct, for a computational simulation, a vector-based representation is far more practical. We derive this by decomposing the incident ray into components parallel and perpendicular to the surface.

Given an incident ray direction $\vec{D}_{inc}$ (unit vector pointing in the direction of propagation) and the surface normal $\vec{N}$ (unit vector pointing from the denser to less dense medium), we decompose:

$$\vec{D}_{inc} = \vec{D}_{\parallel} + \vec{D}_{\perp}$$

where $\vec{D}_{\perp} = (\vec{D}_{inc} \cdot \vec{N})\vec{N}$ is the component along the normal, and $\vec{D}_{\parallel} = \vec{D}_{inc} - \vec{D}_{\perp}$ is the tangential component.

The magnitudes relate to the angles: $|\vec{D}_{\parallel}| = \sin\theta_1$ and $|\vec{D}_{\perp}| = \cos\theta_1$. From Snell's law, the refracted ray's tangential component scales by $\mu = n_1/n_2$:

$$|\vec{D}'_{\parallel}| = \mu \sin\theta_1 = \sin\theta_2$$

The refracted direction is therefore:

$$\vec{D}_{refr} = \mu \vec{D}_{\parallel} + \cos(\theta_2) \vec{N}'$$

where $\vec{N}'$ points in the transmission direction. Substituting $\vec{D}_{\parallel} = \vec{D}_{inc} - (\vec{D}_{inc} \cdot \vec{N})\vec{N}$ and simplifying:

$$ \vec{D}_{refr} = \mu \vec{D}_{inc} + \left(\mu \cos(\theta_1) - \cos(\theta_2)\right) \vec{N} $$

Here, $\cos(\theta_1) = -\vec{D}_{inc} \cdot \vec{N}$ (the negative sign because $\vec{D}_{inc}$ points toward the surface while $\vec{N}$ points away). We find $\cos(\theta_2)$ using the identity $\sin^2\theta + \cos^2\theta = 1$ and Snell's law:

$$ \cos(\theta_2) = \sqrt{1 - \sin^2(\theta_2)} = \sqrt{1 - \mu^2 \sin^2(\theta_1)} = \sqrt{1 - \mu^2 (1 - \cos^2(\theta_1))} $$

#### Total Internal Reflection

A crucial edge case appears when the term inside this square root becomes negative:

$$1 - \mu^2 (1 - \cos^2(\theta_1)) < 0$$

This occurs when $\sin\theta_1 > n_2/n_1$, i.e., when light travels from a denser to a less dense medium (e.g., from glass with $n \approx 1.5$ to air with $n = 1.0$) at a sufficiently shallow angle. The **critical angle** is:

$$\theta_c = \arcsin\left(\frac{n_2}{n_1}\right)$$

For $n_1 = 1.5$ and $n_2 = 1.0$, this gives $\theta_c \approx 41.8°$. Beyond this angle, **Total Internal Reflection (TIR)** occurs: the ray reflects instead of refracting. Our model must flag these rays as invalid since they will not reach the target screen.

### The Computational Model: Tracing Rays

With the physics established, we can build a step-by-step algorithm to trace a ray's path.

#### Generating Initial Rays: The Sunflower Distribution

To properly sample the lens aperture, we need rays distributed uniformly across a circular cross-section. A naive approach using concentric rings creates artificial clustering. Instead, we use the **Vogel spiral** (or sunflower seed) distribution, which places points in a pattern that approximates optimal packing.

For $N$ rays indexed by $k = 1, 2, \ldots, N$, each ray's polar coordinates $(r_k, \phi_k)$ are:

$$\phi_k = k \cdot \varphi$$
$$r_k = R_{beam} \sqrt{\frac{k}{N}}$$

where $\varphi = \pi(3 - \sqrt{5}) \approx 2.3999$ radians is the **golden angle**. This angle is derived from the golden ratio and has the property that successive points never align into obvious radial spokes. The $\sqrt{k/N}$ scaling ensures uniform area density: since area grows as $r^2$, taking the square root compensates to give constant point density.

Converting to Cartesian coordinates for the initial positions:

$$x_k = r_k \cos(\phi_k), \quad y_k = r_k \sin(\phi_k), \quad z_k = z_{start}$$

All initial ray directions are set to $\vec{D}_0 = (0, 0, 1)$ for a collimated beam parallel to the optical axis.

#### Ray-Surface Intersection via Newton's Method

The first step in tracing is determining precisely where a ray hits a lens surface. One approach is to substitute the ray's parametric equation into the sphere's implicit equation, yielding a quadratic in $t$:

$$A t^2 + Bt + C = 0$$

where $A = \vec{D} \cdot \vec{D} = 1$, $B = 2((\vec{P}_0 - \vec{C}_{sphere}) \cdot \vec{D})$, and $C = ||\vec{P}_0 - \vec{C}_{sphere}||^2 - R^2$.

However, for a differentiable implementation with PyTorch, an **iterative Newton-Raphson method** is more numerically stable and generalizes to arbitrary surface shapes. We seek the root of:

$$f(t) = z(t) - z_{surface}(x(t), y(t)) = 0$$

where $z(t) = z_0 + t D_z$ is the ray's z-coordinate at parameter $t$, and $z_{surface}$ is the sag at the ray's $(x,y)$ position.

Newton's method iterates: $t_{n+1} = t_n - \frac{f(t_n)}{f'(t_n)}$

We need the derivative $f'(t)$. Since $f = z(t) - z_{sag}(r^2(t))$ where $r^2 = x^2 + y^2$:

$$f'(t) = \frac{dz}{dt} - \frac{\partial z_{sag}}{\partial r^2} \cdot \frac{dr^2}{dt}$$

The individual terms are:

- $\frac{dz}{dt} = D_z$ (the z-component of the ray direction)
- $\frac{dr^2}{dt} = \frac{d}{dt}(x^2 + y^2) = 2x \frac{dx}{dt} + 2y \frac{dy}{dt} = 2(x D_x + y D_y)$
- From the sag formula $z_{sag} = \frac{cr^2}{1 + \sqrt{1 - c^2 r^2}}$, differentiating:

$$\frac{\partial z_{sag}}{\partial r^2} = \frac{c}{1 + \sqrt{1 - c^2 r^2}} + \frac{c^3 r^2}{(1 + \sqrt{1 - c^2 r^2})^2 \sqrt{1 - c^2 r^2}}$$

After simplification, this reduces to:

$$\frac{\partial z_{sag}}{\partial r^2} = \frac{c}{2\sqrt{1 - c^2 r^2}}$$

Starting from an initial guess $t_0 = (z_{vertex} - z_0)/D_z$ (the planar intersection), typically $3$-$5$ iterations suffice for convergence.

#### The Complete Ray-Tracing Algorithm

The full algorithm for tracing a single ray through our lens is:

1.  **Initialization**: Start with a ray at position $\vec{P}_0$ with direction $\vec{D}_0 = (0, 0, 1)$.

2.  **First Surface Intersection**: Use Newton's method to find $t_1$ such that the ray intersects surface $S_1$ at $\vec{P}_1 = \vec{P}_0 + t_1 \vec{D}_0$.

3.  **Aperture Check**: Verify that $x_1^2 + y_1^2 < R_{aperture}^2$. If not, the ray misses the lens.

4.  **First Refraction**: Compute the surface normal $\vec{N}_1$ at $\vec{P}_1$. Apply vector Snell's law with $n_1 = 1.0$ (air) and $n_2 = n_{lens}$ to obtain the refracted direction $\vec{D}_1$. Check for TIR.

5.  **Second Surface Intersection**: From $\vec{P}_1$ in direction $\vec{D}_1$, find $\vec{P}_2$ on surface $S_2$ using Newton's method.

6.  **Second Aperture Check**: Verify $x_2^2 + y_2^2 < R_{aperture}^2$.

7.  **Second Refraction**: Compute $\vec{N}_2$ at $\vec{P}_2$. **Important**: The normal must point from glass into air, so we negate it (since our normal formula points outward from the sphere center). Apply Snell's law with $n_1 = n_{lens}$ and $n_2 = 1.0$ to get $\vec{D}_2$. Check for TIR.

8.  **Propagation to Target**: Find $t_{target}$ such that $z_2 + t_{target} D_{2,z} = z_{target}$:
    $$t_{target} = \frac{z_{target} - z_2}{D_{2,z}}$$
    The final position is $\vec{P}_{final} = \vec{P}_2 + t_{target} \vec{D}_2$.

9.  **Validity Check**: A ray is valid if it passes all aperture checks, experiences no TIR, and $t_{target} > 0$ (the ray is traveling toward, not away from, the target).

### Tech Stack

The implementation of this differentiable lens optimizer relies on a few key Python libraries. **PyTorch** serves as the core of the project, handling all numerical computations and building a dynamic computation graph to automatically compute gradients via its `autograd` engine, which is essential for optimization. **NumPy** is utilized for initial data creation and for converting PyTorch tensors back to a format compatible with **Matplotlib**, which is responsible for generating all visualizations, including the 2D plot of the lens system with ray paths and the spot diagram on the target plane.

### Optimization with PyTorch

The beauty of this entire process is that it's just a chain of mathematical operations. By implementing this chain using PyTorch tensors, we create a **differentiable simulation**. This allows us to use gradient-based optimization to automatically find the best lens shape.

#### Numerical Stability: The Safe Square Root

Before defining the loss, we must address a subtle but critical numerical issue. Many operations in our ray tracer involve square roots:

- Computing surface normals: $|\vec{P} - \vec{C}| = \sqrt{(x-C_x)^2 + (y-C_y)^2 + (z-C_z)^2}$
- The sag formula: $\sqrt{1 - c^2 r^2}$
- Normalizing vectors: $\sqrt{D_x^2 + D_y^2 + D_z^2}$

The derivative of $\sqrt{x}$ is $\frac{1}{2\sqrt{x}}$, which approaches infinity as $x \to 0$. During backpropagation, this can cause **gradient explosion** or NaN values when the argument is very small.

The solution is a **regularized square root**:

$$\sqrt{x}_\epsilon = \sqrt{\max(x, \epsilon)}$$

where $\epsilon$ is a small positive constant (e.g., $10^{-9}$). This clamps the minimum value, ensuring the gradient remains bounded:

$$\frac{d}{dx}\sqrt{x}_\epsilon = \begin{cases} \frac{1}{2\sqrt{x}} & \text{if } x > \epsilon \\ \frac{1}{2\sqrt{\epsilon}} & \text{if } x \leq \epsilon \end{cases}$$

This small modification is essential for stable optimization.

#### The Loss Function

We need to define a **loss function**—a single number that quantifies how good our lens is. Since the goal is to focus all light to the origin $(0,0)$ on the target plane, a natural metric is the **mean squared distance** of each ray's final position from the origin.

For $K$ valid rays with final positions $(x_k, y_k)$ on the target plane, the loss is:

$$ L(c*1, c_2, t*{lens}) = \frac{1}{K} \sum_{k=1}^{K} (x_k^2 + y_k^2) $$

This equals the squared RMS (Root Mean Square) spot radius. The RMS spot radius itself is $\sigma = \sqrt{L}$, a standard metric in optical design.

Why squared distance rather than absolute distance? The squared form has two advantages:

1. It's everywhere differentiable (unlike $|x|$ which has a cusp at zero)
2. It penalizes outliers more heavily, encouraging the optimizer to reduce large deviations

#### Handling Invalid Rays: The TIR Penalty

Some lens configurations may cause rays to undergo Total Internal Reflection or miss the aperture entirely. These rays don't contribute to the spot on the target, but we can't simply ignore them during optimization—doing so would allow the optimizer to "cheat" by finding configurations where problematic rays are simply excluded.

Instead, we add a **penalty term** proportional to the fraction of invalid rays:

$$L_{total} = L_{spot} + \lambda \cdot (1 - f_{valid})$$

where $f_{valid} = K_{valid}/K_{total}$ is the fraction of valid rays and $\lambda$ is a penalty weight (e.g., $\lambda = 10$). This encourages the optimizer to find solutions where all rays successfully reach the target.

#### PyTorch's Computation Graph and Automatic Differentiation

We declare the lens curvatures and thickness as `torch.nn.Parameter`. This flags these tensors to PyTorch, indicating they should be tracked for gradient computation. When we build our `SimpleLens` model as a `torch.nn.Module`, these parameters are automatically registered.

The key insight is that PyTorch builds a **dynamic computation graph** during the forward pass. Every operation involving tensors with `requires_grad=True` creates a node in this graph, storing the operation type and references to input tensors.

Consider a simplified example where $L = (c_1 \cdot r^2)^2$. Define the intermediate variable $u = c_1 \cdot r^2$, so $L = u^2$. The computation graph is:

$$c_1 \xrightarrow{\times \, r^2} u \xrightarrow{(\cdot)^2} L$$

When `loss.backward()` is called, PyTorch traverses this graph in reverse, applying the **chain rule** at each node:

$$\frac{\partial L}{\partial c_1} = \frac{\partial L}{\partial u} \cdot \frac{\partial u}{\partial c_1} = 2u \cdot r^2 = 2(c_1 r^2) \cdot r^2 = 2 c_1 r^4$$

In our full ray tracer, the graph includes hundreds of operations: ray-surface intersections (Newton iterations), refraction calculations, and the final loss computation. PyTorch handles this complexity automatically, computing $\frac{\partial L}{\partial c_1}$, $\frac{\partial L}{\partial c_2}$, and $\frac{\partial L}{\partial t_{lens}}$ without us writing any derivative code.

#### The Adam Optimizer

With gradients in hand, we need an algorithm to update the parameters. We use **Adam** (Adaptive Moment Estimation), which maintains per-parameter learning rates based on gradient statistics.

Adam tracks two exponential moving averages for each parameter $\theta$:

- **First moment** (mean of gradients): $m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t$
- **Second moment** (mean of squared gradients): $v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2$

where $g_t = \frac{\partial L}{\partial \theta}$ is the current gradient, and typical values are $\beta_1 = 0.9$, $\beta_2 = 0.999$.

Because $m_t$ and $v_t$ are initialized at zero, they're biased toward zero in early iterations. Adam corrects this:

$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}, \quad \hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$

The parameter update is then:

$$\theta_{t+1} = \theta_t - \alpha \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

where $\alpha$ is the base learning rate (e.g., $10^{-4}$) and $\epsilon \approx 10^{-8}$ prevents division by zero.

The denominator $\sqrt{\hat{v}_t}$ acts as adaptive scaling: parameters with consistently large gradients get smaller effective learning rates, while those with small gradients get larger ones. This helps navigate loss landscapes where different parameters have very different sensitivities.

#### The Optimization Loop

The complete optimization follows the standard machine learning loop:

1.  **Zero Gradients**: Call `optimizer.zero_grad()` to clear gradients from the previous iteration.

2.  **Forward Pass**: Run the full ray-tracing simulation with current lens parameters. PyTorch builds the computation graph during this pass.

3.  **Calculate Loss**: Compute the loss $L_{total}$ including the spot size and TIR penalty.

4.  **Backward Pass**: Call `loss.backward()`. PyTorch traverses the computation graph backward, computing gradients via the chain rule.

5.  **Optimizer Step**: Call `optimizer.step()`. Adam updates each parameter using its accumulated gradient statistics.

6.  **Repeat**: Return to step 1 until convergence.

By repeating this loop, the optimizer iteratively refines the lens shape, descending the loss landscape until it discovers the parameters that produce the sharpest possible focus.

### Results and Discussion

The optimization commenced with a simple biconvex lens, characterized by initial radii of curvature $R_1 = 100.00 \text{ mm}$ and $R_2 = -100.00 \text{ mm}$, and an initial thickness of $t_{lens} = 5.00 \text{ mm}$. The initial loss $L$, representing the squared RMS spot radius, was a relatively high $0.1258$, corresponding to an RMS spot radius of $\sigma = \sqrt{0.1258} \approx 0.35 \text{ mm}$.

Over $300$ iterations, the optimizer demonstrated a dramatic improvement in the lens's focusing ability. After $50$ iterations, the loss dropped by nearly two orders of magnitude to $0.001634$ ($\sigma \approx 0.04 \text{ mm}$). The optimization continued to refine the shape, eventually converging to a final loss of approximately $0.001126$ ($\sigma \approx 0.034 \text{ mm}$).

The final, optimized parameters obtained were a front surface radius $R_1 = 95.95 \text{ mm}$, a rear surface radius $R_2 = -94.51 \text{ mm}$, and a lens thickness $t_{lens} = 4.99 \text{ mm}$. The optimizer slightly increased the curvature of both surfaces and minimally reduced the thickness to achieve a much tighter focus. The valid ray metric remained at $100\%$ throughout, indicating that the optimizer successfully avoided any configurations that would cause Total Internal Reflection.

#### Interpreting the Optimized Shape

The optimizer's solution reveals interesting physics. Starting from a symmetric biconvex lens ($|R_1| = |R_2|$), it converged to a slightly asymmetric configuration. This asymmetry is the optimizer's attempt to minimize **spherical aberration**—the phenomenon where rays at different heights from the optical axis focus at different points.

For a single lens focusing a collimated beam, the optimal shape is actually a **plano-convex** lens with the curved side facing the collimated beam, or an asymmetric biconvex lens. The optimizer, constrained only to minimize spot size, naturally discovered this principle.

The **Coddington shape factor** $q$ quantifies lens asymmetry:

$$q = \frac{R_2 + R_1}{R_2 - R_1}$$

For the initial symmetric lens: $q = \frac{-100 + 100}{-100 - 100} = 0$. For the optimized lens: $q \approx \frac{-94.51 + 95.95}{-94.51 - 95.95} \approx -0.0076$. The slight shift from zero indicates the optimizer found that a marginally asymmetric lens reduces aberrations for this configuration.

#### Convergence Behavior

The loss history exhibits characteristic optimization dynamics:

1. **Rapid initial descent** (iterations 0-50): The gradient is large, and Adam takes substantial steps toward the minimum. The loss drops exponentially.

2. **Slowing convergence** (iterations 50-150): As the optimizer approaches the minimum, gradients become smaller. Adam's adaptive learning rate helps maintain progress.

3. **Plateau** (iterations 150+): The optimizer has essentially converged. Further iterations produce negligible improvement, indicating either a local minimum has been reached or numerical precision limits further progress.

The fact that convergence occurs in $\sim 100$ iterations rather than thousands demonstrates the efficiency of gradient-based optimization when the problem is smooth and differentiable. A gradient-free method (e.g., genetic algorithms) would require orders of magnitude more function evaluations.

The following plots visualize the outcome of the optimization.

![](Screenshot 2025-12-14 at 14.58.41.png)

The first figure shows a side view of the final lens system. The incoming parallel rays (green) are traced through the lens and converge to a tight spot on the target plane. The second part of the figure is the spot diagram, showing the final $(x, y)$ positions of all rays on the target. The calculated RMS spot radius is very small, indicating a high-quality focus.

![](Screenshot 2025-12-14 at 14.59.37.png)

The loss history plot clearly shows the optimization process. The logarithmic y-axis reveals the exponential decrease in loss during early iterations, followed by convergence to a plateau. This behavior is typical of gradient descent on smooth, convex-like loss landscapes.

#### Limitations and Extensions

This simple model has several limitations that could be addressed in future work:

- **Monochromatic light**: Real lenses must handle multiple wavelengths. The refractive index $n$ varies with wavelength (dispersion), causing **chromatic aberration**. Extending the model to trace rays at multiple wavelengths would allow optimization of achromatic doublets.

- **Single lens**: Practical optical systems use multiple lens elements. The framework naturally extends to multi-element systems by chaining more surfaces.

- **On-axis only**: We only optimized for on-axis collimated light. Real imaging systems must also handle off-axis rays, requiring optimization over multiple field angles.

- **Manufacturing constraints**: Real lenses have fabrication tolerances. Adding penalty terms for extreme curvatures or thin edges would produce more manufacturable designs.
