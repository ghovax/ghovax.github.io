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

    h2Elements.forEach((h1) => {
      const text = h1.textContent || "";

      // Create a container for the highlighted heading
      const container = document.createElement("span");
      h1.innerHTML = "";
      h1.appendChild(container);

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
