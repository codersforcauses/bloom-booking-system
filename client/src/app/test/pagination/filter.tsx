"use client";

import { useState } from "react";
import { FaFilter } from "react-icons/fa";

import { RoomCombobox } from "@/components/room-combobox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RoomShortResponse } from "@/lib/api-types";
import { cn } from "@/lib/utils";

import { CustomFetchBookingParams } from "./page";

type FilterPopoverProps = {
  selectedRooms?: RoomShortResponse[];
  initialFilters?: CustomFetchBookingParams;
  onApply: (
    filters: CustomFetchBookingParams,
    rooms: RoomShortResponse[],
  ) => void;
  className?: string;
};

export function FilterPopover({
  initialFilters,
  selectedRooms = [],
  onApply,
  className,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);

  // Temporary state inside the popover
  const [tempRooms, setTempRooms] = useState<RoomShortResponse[]>([]);
  const [tempVisitorName, setTempVisitorName] = useState("");
  const [tempVisitorEmail, setTempVisitorEmail] = useState("");

  // Sync temp state when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTempRooms(selectedRooms);
      setTempVisitorName(initialFilters?.visitor_name ?? "");
      setTempVisitorEmail(initialFilters?.visitor_email ?? "");
    }
    setOpen(isOpen);
  };

  const handleApply = () => {
    onApply(
      {
        room_ids: tempRooms.length
          ? tempRooms.map((r) => String(r.id)).join(",")
          : undefined,
        visitor_name: tempVisitorName || undefined,
        visitor_email: tempVisitorEmail || undefined,
      },
      tempRooms,
    );
    setOpen(false);
  };

  // Automatically open sections that have active filters
  const defaultValue = [
    ...(tempRooms.length ? ["room"] : []),
    ...(tempVisitorName ? ["visitor_name"] : []),
    ...(tempVisitorEmail ? ["visitor_email"] : []),
  ];

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2 border-2 bg-white p-2 hover:bg-muted",
            className,
          )}
        >
          <FaFilter size={16} />
          Filter
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        {/* Header */}
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Filter</h2>
        </div>

        {/* Scrollable content */}
        <div className="max-h-[360px] overflow-y-auto px-4 py-2">
          <Accordion
            type="multiple"
            defaultValue={defaultValue}
            className="w-full divide-y"
          >
            {/* Rooms */}
            <AccordionItem value="room">
              <AccordionTrigger className="py-3 text-sm font-medium">
                Room
              </AccordionTrigger>
              <AccordionContent>
                <RoomCombobox value={tempRooms} onChange={setTempRooms} />
              </AccordionContent>
            </AccordionItem>

            {/* Visitor Name */}
            <AccordionItem value="visitor_name">
              <AccordionTrigger className="py-3 text-sm font-medium">
                Visitor Name
              </AccordionTrigger>
              <AccordionContent>
                <Input
                  type="text"
                  value={tempVisitorName}
                  onChange={(e) => setTempVisitorName(e.target.value)}
                  placeholder="Visitor Name"
                  className="w-full rounded border px-2 py-1 text-sm"
                />
              </AccordionContent>
            </AccordionItem>

            {/* Visitor Email */}
            <AccordionItem value="visitor_email">
              <AccordionTrigger className="py-3 text-sm font-medium">
                Visitor Email
              </AccordionTrigger>
              <AccordionContent>
                <Input
                  type="text"
                  value={tempVisitorEmail}
                  onChange={(e) => setTempVisitorEmail(e.target.value)}
                  placeholder="Visitor Email"
                  className="w-full rounded border px-2 py-1 text-sm"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-4 py-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
