// This is imported into input.tsx

import clsx from "clsx";
import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

const Badge: React.FC<BadgeProps> = ({ children, className }) => {
  return (
    <span
      className={clsx("caption rounded-md border px-2 py-0.5", className)}
      style={{
        backgroundColor: "hsl(var(--secondary))",
        color: "inherit",
        borderColor: "inherit",
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
