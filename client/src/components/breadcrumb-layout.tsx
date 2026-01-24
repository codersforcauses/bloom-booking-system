"use client";

import { usePathname } from "next/navigation";

import Breadcrumb, { BreadcrumbItem } from "@/components/breadcrumb";

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label =
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    breadcrumbs.push({ label, href: currentPath });
  }

  return breadcrumbs;
}

export default function BreadcrumbLayout() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return <Breadcrumb items={breadcrumbs} className="px-6 py-4" />;
}
