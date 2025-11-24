"use client";

import { ReactNode,useState } from "react";

import { cn } from "@/lib/utils";

type AccordionItemProps = {
  id: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function AccordionItem({
  id,
  title,
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
      >
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xl font-light">{open ? "−" : "+"}</span>
      </button>

      <div
        id={`${id}-panel`}
        className={cn(
          "overflow-hidden px-4 transition-all",
          open ? "max-h-screen pb-3" : "max-h-0",
        )}
      >
        {open && <div className="pt-1">{children}</div>}
      </div>
    </div>
  );
}

export function Accordion({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-md border border-gray-200 bg-white">
      {children}
    </div>
  );
}
