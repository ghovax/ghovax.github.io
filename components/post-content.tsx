"use client";

import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { componentRegistry } from "./post-components";
import { Highlighter } from "./ui/highlighter";

interface PostContentProps {
  htmlContent: string;
}

export function PostContent({ htmlContent }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    // Find all component markers in the HTML
    const markers = contentRef.current.querySelectorAll("[data-component]");

    markers.forEach((marker) => {
      const componentName = marker.getAttribute("data-component");
      const propsJson = marker.getAttribute("data-props");

      if (!componentName || !(componentName in componentRegistry)) {
        console.warn(`Component "${componentName}" not found in registry`);
        return;
      }

      try {
        const props = propsJson ? JSON.parse(propsJson) : {};
        const Component = componentRegistry[componentName];

        // Create a container for the React component
        const container = document.createElement("div");
        marker.replaceWith(container);

        // Render the component
        const root = (window as any).__REACT_ROOT_CACHE__ || new Map();
        if (!root.has(container)) {
          const reactRoot = createRoot(container);
          root.set(container, reactRoot);
          (window as any).__REACT_ROOT_CACHE__ = root;
        }

        root.get(container).render(<Component {...props} />);
      } catch (error) {
        console.error(`Error rendering component "${componentName}":`, error);
      }
    });

    // Wrap all h2 headings with Highlighter component
    const h2Elements = contentRef.current.querySelectorAll("h1");

    // Generate evenly distributed unique hues for each heading
    const hues = Array.from({ length: h2Elements.length }, (_, index) => {
      // Distribute hues evenly across the color wheel with golden ratio offset
      // This ensures maximum color distinction between consecutive headings
      const goldenRatioConjugate = 0.618033988749895;
      return Math.floor((index * goldenRatioConjugate * 360) % 360);
    });

    h2Elements.forEach((h1, index) => {
      const text = h1.textContent || "";

      // Create a container for the highlighted heading
      const container = document.createElement("span");
      h1.innerHTML = "";
      h1.appendChild(container);

      // Convert HSL to RGBA with consistent alpha
      const hue = hues[index];
      const saturation = 70; // Medium saturation for pleasant colors
      const lightness = 60; // Medium lightness
      const alpha = 0.53; // Same alpha as #32bc4dbb (which is ~73% opacity)

      // Convert HSL to RGB
      const h = hue / 60;
      const c = (1 - Math.abs(2 * lightness / 100 - 1)) * (saturation / 100);
      const x = c * (1 - Math.abs((h % 2) - 1));
      const m = lightness / 100 - c / 2;

      let r = 0, g = 0, b = 0;
      if (h >= 0 && h < 1) { r = c; g = x; b = 0; }
      else if (h >= 1 && h < 2) { r = x; g = c; b = 0; }
      else if (h >= 2 && h < 3) { r = 0; g = c; b = x; }
      else if (h >= 3 && h < 4) { r = 0; g = x; b = c; }
      else if (h >= 4 && h < 5) { r = x; g = 0; b = c; }
      else if (h >= 5 && h < 6) { r = c; g = 0; b = x; }

      const red = Math.round((r + m) * 255);
      const green = Math.round((g + m) * 255);
      const blue = Math.round((b + m) * 255);

      const color = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

      // Render the Highlighter component
      const root = (window as any).__REACT_ROOT_CACHE__ || new Map();
      if (!root.has(container)) {
        const reactRoot = createRoot(container);
        root.set(container, reactRoot);
        (window as any).__REACT_ROOT_CACHE__ = root;
      }

      root.get(container).render(
        <Highlighter
          action="highlight"
          color={color}
          strokeWidth={2}
          animationDuration={800}
          padding={4}
          multiline={true}
          isView={true}
        >
          {text}
        </Highlighter>
      );
    });
  }, [htmlContent]);

  return (
    <div
      ref={contentRef}
      className="document"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
