"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const ROOM_NAMES = ["Jasmin", "Lily", "Lotus", "Marigold", "Rose"];

export default function FilterDropDown() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-[360px] rounded-xl border bg-white p-4 shadow-sm">
        {/* Card title */}
        <h2 className="mb-2 text-base font-semibold">Filter</h2>

        {/* Inner accordion with multiple sections */}
        <Accordion
          type="multiple"
          defaultValue={["room-name"]}
          className="w-full divide-y"
        >
          {/* Room Name section (open by default) */}
          <AccordionItem value="room-name" className="border-none">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Room Name
            </AccordionTrigger>
            <AccordionContent>
              <div className="mt-1 space-y-2 pl-1 text-sm">
                {ROOM_NAMES.map((name) => (
                  <label key={name} className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4" />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Date section */}
          <AccordionItem value="date">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Date
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Date controls go here…
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Time section */}
          <AccordionItem value="time">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Time
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Time controls go here…
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Location section */}
          <AccordionItem value="location">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Location
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Location options go here…
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Status section */}
          <AccordionItem value="status">
            <AccordionTrigger className="justify-between py-3 text-sm font-medium">
              Status
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Status options go here…
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer buttons */}
        <div className="mt-4 flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" className="px-6">
            Cancel
          </Button>
          <Button className="px-6">Apply</Button>
        </div>
      </div>
    </div>
  );
}
