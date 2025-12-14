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
  if (!items?.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ul className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, i) => {
          const last = i === items.length - 1;

          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-2">
              {!last && item.href ? (
                <Link
                  href={item.href}
                  className="underline-offset-2 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  style={last ? { color: "var(--bloom-orbit)" } : undefined}
                >
                  {item.label}
                </span>
              )}
              {!last && <span>/</span>}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
