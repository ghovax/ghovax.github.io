To better learn PyTorch, I set out to develop an optimization program that combines the physics of lenses with machine learning. The goal is to design the shape of a single glass lens that takes a given bundle of parallel incoming light rays and focuses them to a single, theoretically infinitesimal point on a screen at a specified distance.

### Physics of Ray Optics

Because the apertures have diameters hundreds of times larger than the wavelength of light, we operate in the regime of geometrical optics, which treats light as rays. The underlying assumption is that light travels in straight lines within a uniform medium and that each ray is independent, with no interactions between rays. Wave effects such as diffraction and interference are neglected because the lens features are large compared with the wavelength. However, we will apply the full Snell’s law rather than the paraxial approximation, so the model remains accurate for rays at steep angles relative to the optical axis.

A light ray is mathematically represented by a vector with a given origin $\vec{P}_0$ and a normalized direction (unit length) $\vec{D}$. With the origin and direction fixed, the position along the ray can be parameterized by the distance $t$ traveled along its path:

$$\vec{P}(t) = \vec{P}_0 + t \vec{D}$$

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

With the physics established, we can build a step-by-step algorithm to trace a ray's path. The first step is to determine precisely where a ray hits a lens surface. The script uses an iterative solver, but another way is to substitute the ray's parametric equation into the sphere's equation, which directly arrives at a quadratic equation in terms of the distance $t$, that is $At^2 + Bt + C = 0$, where:

$$A = \vec{D} \cdot \vec{D} = 1$$
$$B = 2((\vec{P}_0 - \vec{C}_{sphere}) \cdot \vec{D})$$
$$C = ||\vec{P}_0 - \vec{C}_{sphere}||^2 - R^2$$

Solving for $t$ with the quadratic formula gives us the distance to the intersection point. The full algorithm for tracing a single ray through our lens is then as follows:

1.  **Initialization**: Start with an initial ray, for instance, originating at $\vec{P}_0$ with direction $\vec{D}_0 = (0, 0, 1)$ for a collimated beam parallel to the z-axis.
2.  **First Surface Intersection**: Calculate the intersection point $\vec{P}_1$ of the ray with the first surface, $S_1$.
3.  **First Refraction**: At $\vec{P}_1$, calculate the surface normal $\vec{N}_1$ and apply the vector Snell's law to get the new ray direction, $\vec{D}_1$, as it enters the lens (with refractive index $n_{lens}$).
4.  **Second Surface Intersection**: Trace the new ray from $\vec{P}_1$ in direction $\vec{D}_1$ until it intersects the second surface, $S_2$, at point $\vec{P}_2$.
5.  **Second Refraction**: At $\vec{P}_2$, calculate the surface normal $\vec{N}_2$ and apply Snell's law again to find the final direction, $\vec{D}_2$, as the ray exits the lens back into the air ($n=1.0$).
6.  **Propagation to Target**: Propagate the final ray from $\vec{P}_2$ in direction $\vec{D}_2$ to the target plane at a fixed z-coordinate, $z_{target}$. This gives us the final coordinates $\vec{P}_{final}$ on the screen.

### Tech Stack

The implementation of this differentiable lens optimizer relies on a few key Python libraries. **PyTorch** serves as the core of the project, handling all numerical computations and building a dynamic computation graph to automatically compute gradients via its `autograd` engine, which is essential for optimization. **NumPy** is utilized for initial data creation and for converting PyTorch tensors back to a format compatible with **Matplotlib**, which is responsible for generating all visualizations, including the 2D plot of the lens system with ray paths and the spot diagram on the target plane.

### Optimization with PyTorch

The beauty of this entire process is that it's just a chain of mathematical operations. By implementing this chain using PyTorch tensors, we create a **differentiable simulation**. This allows us to use gradient-based optimization to automatically find the best lens shape.

To do this, we need to define a **loss function**—a single number that quantifies how good our lens is. Since the goal is to focus all light to the origin $(0,0)$ on the target plane, a perfect metric is the average of the squared distances of each ray's final position from that origin. For $K$ valid rays, the loss $L$ for lens curvatures $c_1$, $c_2$, and thickness $t_{lens}$ is:

$$ L(c_1, c_2, t_{lens}) = \frac{1}{K} \sum_{k=1}^{K} (x_k^2 + y_k^2) $$

This value is effectively the squared Root Mean Square (RMS) spot radius. Our goal is to find the parameters that minimize this value.

We declare the lens curvatures and thickness as `torch.nn.Parameter`. This is a crucial step that flags these tensors to PyTorch, indicating that they are parameters that should be optimized. When we build our `SimpleLens` model as a `torch.nn.Module`, these parameters are automatically registered.

The optimization then follows the standard machine learning loop:

1.  **Forward Pass**: Run the full ray-tracing simulation with the current lens parameters to get the final positions of all rays on the target plane. During this pass, PyTorch builds a **dynamic computation graph**, recording every operation that involves a tensor with `requires_grad=True`.
2.  **Calculate Loss**: Compute the loss using the formula above. This loss value is the root of our computation graph.
3.  **Backward Pass**: Call `loss.backward()`. This is where PyTorch's `autograd` engine does its magic. It traverses the computation graph backward from the loss node, applying the **chain rule** at each step to compute the gradient of the loss with respect to every learnable parameter. This gives us $\frac{\partial L}{\partial c_1}$, $\frac{\partial L}{\partial c_2}$, and $\frac{\partial L}{\partial t_{lens}}$.
4.  **Optimizer Step**: An optimizer, in this case `torch.optim.Adam`, is given the list of model parameters. When `optimizer.step()` is called, it uses the computed gradients to update the parameters. Adam is a sophisticated algorithm that uses moving averages of the gradient and its squared values to adapt the learning rate for each parameter, often leading to faster convergence than simple Stochastic Gradient Descent (SGD).

By repeating this loop, the optimizer iteratively refines the lens shape, "walking" down the loss landscape until it discovers the parameters that produce the sharpest possible focus.

### Results and Discussion

The optimization commenced with a simple biconvex lens, characterized by initial radii of curvature $R_1 = 100.00 \text{ mm}$ and $R_2 = -100.00 \text{ mm}$, and an initial thickness of $t_{lens} = 5.00 \text{ mm}$. The initial loss $L$, representing the squared RMS spot radius, was a relatively high $0.1258$.

Over $300$ iterations, the optimizer demonstrated a dramatic improvement in the lens's focusing ability. After $50$ iterations, the loss dropped by nearly two orders of magnitude to $0.001634$. The optimization continued to refine the shape, eventually converging to a final loss of approximately $0.001126$.

The final, optimized parameters obtained were a front surface radius $R_1 = 95.95 \text{ mm}$, a rear surface radius $R_2 = -94.51 \text{ mm}$, and a lens thickness $t_{lens} = 4.99 \text{ mm}$. The optimizer slightly increased the curvature of both surfaces and minimally reduced the thickness to achieve a much tighter focus. The valid ray metric remained at $100\%$ throughout, indicating that the optimizer successfully avoided any configurations that would cause Total Internal Reflection.

The following plots visualize the outcome of the optimization.

![](Screenshot 2025-12-14 at 14.58.41.png)

The first figure shows a side view of the final lens system. The incoming parallel rays (green) are traced through the lens and converge to a tight spot on the target plane. The second part of the figure is the spot diagram, showing the final (x, y) positions of all rays on the target. The calculated RMS spot radius is very small, indicating a high-quality focus.

![](Screenshot 2025-12-14 at 14.59.37.png)

The loss history plot clearly shows the optimization process. The loss decreases exponentially in the first ~50 iterations and then plateaus, indicating that the optimizer has found a good local minimum in the solution space. This rapid convergence demonstrates the power of gradient-based optimization for this kind of physics-based problem.
