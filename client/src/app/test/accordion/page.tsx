"use client";

import { Accordion, AccordionItem } from "@/components/ui/accordion";

export default function AccordionDemoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xs overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold">
          Filter
        </div>

        {/* Accordion sections */}
        <Accordion>
          <AccordionItem id="room-name" title="Room Name" defaultOpen>
            <div className="flex flex-col gap-2">
              {["Jasmin", "Lily", "Lotus", "Marigold", "Rose"].map((name) => (
                <label
                  key={name}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input type="checkbox" />
                  <span>{name}</span>
                </label>
              ))}
            </div>
          </AccordionItem>

          <AccordionItem id="date" title="Date">
            <p className="text-sm text-gray-600">Date picker goes here…</p>
          </AccordionItem>

          <AccordionItem id="time" title="Time">
            <p className="text-sm text-gray-600">Time controls go here…</p>
          </AccordionItem>

          <AccordionItem id="location" title="Location">
            <p className="text-sm text-gray-600">Location options go here…</p>
          </AccordionItem>

          <AccordionItem id="status" title="Status">
            <p className="text-sm text-gray-600">Status options go here…</p>
          </AccordionItem>
        </Accordion>

        {/* Footer buttons */}
        <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <button
            type="button"
            className="flex-1 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-full bg-sky-400 px-3 py-2 text-sm font-medium text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </main>
  );
}
