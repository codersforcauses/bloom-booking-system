import Link from "next/link";
import React from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-1"
            >
              {!isLast && item.href ? (
                <Link
                  href={item.href}
                  className="underline-offset-2 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium" : ""}
                  style={isLast ? { color: "var(--bloom-orbit)" } : {}}
                >
                  {item.label}
                </span>
              )}

              {!isLast && <span>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
