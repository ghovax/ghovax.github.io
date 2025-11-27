"use client";

import React, { useEffect, useRef } from 'react';
import { componentRegistry } from './post-components';

interface PostContentProps {
    htmlContent: string;
}

export function PostContent({ htmlContent }: PostContentProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contentRef.current) return;

        // Find all component markers in the HTML
        const markers = contentRef.current.querySelectorAll('[data-component]');

        markers.forEach((marker) => {
            const componentName = marker.getAttribute('data-component');
            const propsJson = marker.getAttribute('data-props');

            if (!componentName || !(componentName in componentRegistry)) {
                console.warn(`Component "${componentName}" not found in registry`);
                return;
            }

            try {
                const props = propsJson ? JSON.parse(propsJson) : {};
                const Component = componentRegistry[componentName];

                // Create a container for the React component
                const container = document.createElement('div');
                marker.replaceWith(container);

                // Render the component
                const root = (window as any).__REACT_ROOT_CACHE__ || new Map();
                if (!root.has(container)) {
                    const { createRoot } = require('react-dom/client');
                    const reactRoot = createRoot(container);
                    root.set(container, reactRoot);
                    (window as any).__REACT_ROOT_CACHE__ = root;
                }

                root.get(container).render(<Component {...props} />);
            } catch (error) {
                console.error(`Error rendering component "${componentName}":`, error);
            }
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
