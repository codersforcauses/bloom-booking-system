"use client";

import { useState } from "react";
import { FaFilter } from "react-icons/fa";

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
import { RoomResponse } from "@/lib/api-types";
import { cn } from "@/lib/utils";

import { CustomFetchBookingParams } from "./page";

type FilterPopoverProps = {
  rooms: RoomResponse[];
  initialFilters?: CustomFetchBookingParams;
  onApply: (filters: CustomFetchBookingParams) => void;
  className?: string;
};

export function FilterPopover({
  rooms,
  initialFilters,
  onApply,
  className,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);

  const [selectedRooms, setSelectedRooms] = useState<string[]>(
    initialFilters?.room_ids ? initialFilters.room_ids.split(",") : [],
  );
  const [visitorName, setVisitorName] = useState(
    initialFilters?.visitor_name ?? "",
  );
  const [visitorEmail, setVisitorEmail] = useState(
    initialFilters?.visitor_email ?? "",
  );

  const toggleRoom = (roomId: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
  };

  const handleApply = () => {
    onApply({
      room_ids: selectedRooms.length ? selectedRooms.join(",") : undefined,
      visitor_name: visitorName || undefined,
      visitor_email: visitorEmail || undefined,
    });
  };

  // Automatically open sections that have active filters
  const defaultValue = [
    ...(selectedRooms.length ? ["room"] : []),
    ...(visitorName ? ["visitor_name"] : []),
    ...(visitorEmail ? ["visitor_email"] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
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

      <PopoverContent className="w-[360px] p-0">
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
                <div className="space-y-2 pl-1 text-sm">
                  {rooms.map((room) => (
                    <label key={room.id} className="flex items-center gap-2">
                      <Input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedRooms.includes(String(room.id))}
                        onChange={() => toggleRoom(String(room.id))}
                      />
                      <span>{room.name}</span>
                    </label>
                  ))}
                </div>
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
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
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
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
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
