// This is imported into input.tsx
"use client";
import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5",
        "caption bg-[hsl(var(--secondary))] text-[hsl(var(--card-foreground))]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
