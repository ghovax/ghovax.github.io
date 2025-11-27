"use client";

import { Highlighter } from "./ui/highlighter";

interface PostTitleProps {
  children: React.ReactNode;
  variant?: "featured" | "regular";
  className?: string;
}

export function PostTitle({
  children,
  variant = "regular",
  className = "",
}: PostTitleProps) {
  const colors = {
    featured: "#10b98160", // emerald with alpha
    regular: "#f59e0b60", // amber with alpha
  };

  return (
    <Highlighter
      action="highlight"
      color={colors[variant]}
      isView={true}
      animationDuration={600}
      strokeWidth={2}
      className={className}
    >
      {children}
    </Highlighter>
  );
}
