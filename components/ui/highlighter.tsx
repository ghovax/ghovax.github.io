"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import { useInView } from "motion/react";
import { annotate } from "rough-notation";
import { type RoughAnnotation } from "rough-notation/lib/model";
import { cn } from "@/lib/utils";

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket";

interface HighlighterProps {
  children: React.ReactNode;
  action?: AnnotationAction;
  color?: string;
  strokeWidth?: number;
  animationDuration?: number;
  iterations?: number;
  padding?: number;
  multiline?: boolean;
  isView?: boolean;
  offsetY?: number;
  className?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function lightenColor(hex: string, factor: number): string {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Find min and max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Lighten by increasing lightness
  l = Math.min(1, l * factor);

  // Convert back to RGB
  let r2, g2, b2;
  if (s === 0) {
    r2 = g2 = b2 = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r2 = hue2rgb(p, q, h + 1 / 3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1 / 3);
  }

  const newR = Math.floor(r2 * 255);
  const newG = Math.floor(g2 * 255);
  const newB = Math.floor(b2 * 255);
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

function darkenColor(hex: string, factor: number): string {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Find min and max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Darken by reducing lightness
  l = Math.max(0, l * factor);

  // Convert back to RGB
  let r2, g2, b2;
  if (s === 0) {
    r2 = g2 = b2 = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r2 = hue2rgb(p, q, h + 1 / 3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1 / 3);
  }

  const newR = Math.floor(r2 * 255);
  const newG = Math.floor(g2 * 255);
  const newB = Math.floor(b2 * 255);
  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}

export function Highlighter({
  children,
  action = "highlight",
  color,
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 1,
  padding = 2,
  multiline = false,
  isView = false,
  offsetY = 0,
  className,
}: HighlighterProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const annotationRef = useRef<RoughAnnotation | null>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [individualSvgs, setIndividualSvgs] = useState<string[]>([]);
  const [resolvedColor, setResolvedColor] = useState<string>(
    color || "#32bc4dbb",
  );
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains("dark") : false,
  );

  const isInView = useInView(containerRef, {
    once: true,
    margin: "-10%",
  });

  // If isView is false, always show. If isView is true, wait for inView
  const shouldShow = !isView || isInView;

  // Inject keyframes into document head once to avoid duplication in rendered content
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const styleId = "highlighter-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes highlight-fade-in {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Observe theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Determine the appropriate color based on theme and provided color
  useEffect(() => {
    if (color) {
      if (isDark) {
        // Handle rgba colors
        if (color.startsWith("rgba(")) {
          const rgbaMatch = color.match(
            /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/,
          );
          if (rgbaMatch) {
            const r = parseInt(rgbaMatch[1]);
            const g = parseInt(rgbaMatch[2]);
            const b = parseInt(rgbaMatch[3]);
            const a = parseFloat(rgbaMatch[4]);
            // For dark mode, darken the color for better visibility on white text
            const darkenedHex = darkenColor(
              `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
              0.6,
            );
            // Convert back to rgba with original alpha
            const darkenedRgb = hexToRgb(darkenedHex);
            if (darkenedRgb) {
              setResolvedColor(
                `rgba(${darkenedRgb.r}, ${darkenedRgb.g}, ${darkenedRgb.b}, ${a})`,
              );
              return;
            }
          }
        } else if (color.startsWith("#")) {
          // Handle hex colors (6 or 8 digits)
          const hexMatch = color.match(/^#([a-f\d]{6})([a-f\d]{2})?$/i);
          if (hexMatch) {
            const rgbHex = hexMatch[1];
            const alphaHex = hexMatch[2];
            const darkenedRgbHex = darkenColor(`#${rgbHex}`, 0.6);
            if (alphaHex) {
              // 8-digit hex, keep alpha
              const alpha = parseInt(alphaHex, 16) / 255;
              const darkenedRgb = hexToRgb(darkenedRgbHex);
              if (darkenedRgb) {
                setResolvedColor(
                  `rgba(${darkenedRgb.r}, ${darkenedRgb.g}, ${darkenedRgb.b}, ${alpha})`,
                );
                return;
              }
            } else {
              // 6-digit hex
              setResolvedColor(darkenedRgbHex);
              return;
            }
          }
        }
      }
      setResolvedColor(color);
      return;
    }

    // Use theme-appropriate colors
    setResolvedColor(isDark ? "#60a5fa" : "#32bc4dbb");
  }, [color, isDark]);

  useEffect(() => {
    if (!shouldShow || !contentRef.current) return;

    const element = contentRef.current;
    let isInitialRender = true;

    const annotationConfig = {
      type: action,
      color: resolvedColor,
      strokeWidth,
      animationDuration,
      iterations,
      padding,
      multiline: true, // Always use multiline for rough-notation to handle wrapping
    };

    const createAndCaptureAnnotation = () => {
      // Remove previous annotation if exists
      if (annotationRef.current) {
        annotationRef.current.remove();
      }

      // Clear any existing SVG elements before creating new annotation
      const existingSvg = element.querySelector("svg");
      if (existingSvg) {
        existingSvg.remove();
      }

      const annotation = annotate(element, annotationConfig);
      annotationRef.current = annotation;

      // Show annotation temporarily to capture SVG
      annotation.show();

      // Wait for animation to complete, then extract and process SVG
      const timeoutId = setTimeout(() => {
        const svgElement = element.querySelector("svg");
        if (svgElement) {
          let finalSvg = svgElement.cloneNode(true) as SVGElement;

          // If multiline prop is false, we need to split into individual line highlights
          if (!multiline) {
            // Get all path elements (the actual drawn annotations)
            const paths = Array.from(svgElement.querySelectorAll("path"));

            if (paths.length > 0) {
              // Create separate SVGs for each path to animate them individually
              const svgContainer = svgElement.cloneNode(false) as SVGElement;
              const individualSvgStrings: string[] = [];

              paths.forEach((path, index) => {
                const individualSvg = svgElement.cloneNode(false) as SVGElement;
                individualSvg.appendChild(path.cloneNode(true));

                // Apply offsetY to each individual SVG
                if (offsetY !== 0) {
                  individualSvg.style.transform = `translateY(${offsetY}px)`;
                }

                individualSvgStrings.push(individualSvg.outerHTML);
              });

              // Store individual SVGs for separate animation
              setIndividualSvgs(individualSvgStrings);

              // Don't set svgContent for multiline=false, use individualSvgs instead
              return;
            }
          }

          // Apply offsetY to the SVG's style
          if (offsetY !== 0) {
            finalSvg.style.transform = `translateY(${offsetY}px)`;
          }

          setSvgContent(finalSvg.outerHTML);
          setIndividualSvgs([]); // Clear individual SVGs when using multiline
          // Remove the original overlay after capturing
          svgElement.remove();
        }
      }, animationDuration + 100);

      return timeoutId;
    };

    const timeoutId = createAndCaptureAnnotation();

    const resizeObserver = new ResizeObserver(() => {
      // Skip the initial resize event to avoid double rendering
      if (isInitialRender) {
        isInitialRender = false;
        return;
      }

      // Remove previous annotation if exists
      if (annotationRef.current) {
        annotationRef.current.remove();
      }

      // Clear any existing SVG elements before creating new annotation
      const existingSvg = element.querySelector("svg");
      if (existingSvg) {
        existingSvg.remove();
      }

      // Re-create annotation on resize
      const newAnnotation = annotate(element, annotationConfig);
      annotationRef.current = newAnnotation;
      newAnnotation.show();

      setTimeout(() => {
        const svgElement = element.querySelector("svg");
        if (svgElement) {
          let finalSvg = svgElement.cloneNode(true) as SVGElement;

          if (!multiline) {
            const paths = Array.from(svgElement.querySelectorAll("path"));

            if (paths.length > 0) {
              const individualSvgStrings: string[] = [];

              paths.forEach((path, index) => {
                const individualSvg = svgElement.cloneNode(false) as SVGElement;
                individualSvg.appendChild(path.cloneNode(true));

                // Apply offsetY to each individual SVG
                if (offsetY !== 0) {
                  individualSvg.style.transform = `translateY(${offsetY}px)`;
                }

                individualSvgStrings.push(individualSvg.outerHTML);
              });

              // Store individual SVGs for separate animation
              setIndividualSvgs(individualSvgStrings);

              // Don't set svgContent for multiline=false, use individualSvgs instead
              return;
            }
          }

          // Apply offsetY to the SVG's style
          if (offsetY !== 0) {
            finalSvg.style.transform = `translateY(${offsetY}px)`;
          }

          setSvgContent(finalSvg.outerHTML);
          setIndividualSvgs([]); // Clear individual SVGs when using multiline
          svgElement.remove();
        }
      }, animationDuration + 100);
    });

    resizeObserver.observe(element);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      if (annotationRef.current) {
        annotationRef.current.remove();
      }
    };
  }, [
    shouldShow,
    action,
    resolvedColor,
    strokeWidth,
    animationDuration,
    iterations,
    padding,
    multiline,
  ]);

  return (
    <span ref={containerRef} className={cn("relative inline-block", className)}>
      {multiline
        ? svgContent && (
            <span
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 0 }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )
        : individualSvgs.map((svgString, index) => (
            <span
              key={index}
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 0,
                animation: `highlight-fade-in ${animationDuration}ms ease-out ${index * 200}ms both`,
              }}
              dangerouslySetInnerHTML={{ __html: svgString }}
            />
          ))}
      <span ref={contentRef} className="relative" style={{ zIndex: 1 }}>
        {children}
      </span>
    </span>
  );
}
