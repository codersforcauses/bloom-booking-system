"use client";

import Image from "next/image";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Room } from "@/types/card";

import { Button } from "./ui/button";

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='20'>No image</text></svg>";

/**
 * Displays a room with details in a label-value grid format.
 *
 * Shows image, room name, location, and availability.
 * Intended for general / admin use as an info card.
 */
function RoomCard({ room }: { room: Room }) {
  const roomDetailsGroups = [
    { label: "Room Name", value: room.title },
    { label: "Location", value: room.location },
    { label: "Availability", value: room.availability },
  ];

  return (
    <div className="flex w-full flex-col bg-white shadow-sm">
      <div className="w-full p-4">
        <div className="relative h-40 w-full">
          <Image
            src={room.image || PLACEHOLDER_IMAGE}
            alt={room.title}
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="grid grid-cols-[7rem_1fr] gap-y-3 px-4 pb-4">
        {roomDetailsGroups.map((item) => (
          <div key={item.label} className="contents">
            <span className="text-[14px] font-medium text-gray-400">
              {item.label}
            </span>
            <span className="text-[14px] font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type BookingRoomProps = {
  room: Room;
  onBook?: () => void;
};

/**
 * User-facing booking card for displaying a room.
 *
 * Responsive: shows compact card on mobile, detailed card on desktop.
 * Includes image, title, location, availability, and a Book button.
 */
function BookingRoomCard({ room, onBook }: BookingRoomProps) {
  return (
    <Card className="flex w-full flex-col overflow-hidden rounded-xl border-black bg-white shadow-md">
      <div className="relative h-40 w-full">
        <Image
          src={room.image || PLACEHOLDER_IMAGE}
          alt={room.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-1 px-4 py-3">
        <span className="text-[14px] font-bold">{room.title}</span>
        <span className="text-[13px] font-semibold text-gray-400">
          {room.location}
        </span>
      </div>

      <div className="mt-auto flex justify-start px-4 pb-4">
        <Button variant="outline" onClick={onBook}>
          Book
        </Button>
      </div>
    </Card>
  );
}

type AdminRoomCardProps = {
  room: Room;
  onView?: () => void;
  onEdit?: () => void;
  onStatusChange?: () => void;
};

/**
 * Admin card for managing room details.
 *
 * Displays room info: name, location, availability, and active status.
 * Includes admin action buttons: View Bookings, Edit, Set inactive / active.
 */
function AdminRoomCard({
  room,
  onView,
  onEdit,
  onStatusChange,
}: AdminRoomCardProps) {
  const roomDetails = [
    { label: "Room Name", value: room.title },
    { label: "Location", value: room.location },
    { label: "Availability", value: room.availability },
  ];

  return (
    <div className="flex w-full flex-col overflow-hidden bg-white p-4 shadow-sm">
      <div className="relative h-40 w-full">
        <Image
          src={room.image || PLACEHOLDER_IMAGE}
          alt={room.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="space-y-2 py-4">
        {roomDetails.map((item) => (
          <div
            key={item.label}
            className="grid grid-cols-[6rem_1fr] gap-x-2 text-[14px] font-medium"
          >
            <span className="text-gray-400">{item.label}</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap gap-4">
        <Button
          className="caption h-6 bg-bloom-orbit text-white hover:bg-bloom-orbit-light"
          onClick={onView}
        >
          View Bookings
        </Button>
        <Button
          className="caption h-6 bg-bloom-yellow text-white hover:bg-bloom-yellow-light"
          onClick={onEdit}
        >
          Edit
        </Button>

        {room.isActive ? (
          <Button
            className={cn(
              "caption h-6 bg-bloom-red text-white hover:bg-bloom-red-light",
            )}
            onClick={onStatusChange}
          >
            Set inactive
          </Button>
        ) : (
          <Button
            className={cn(
              "caption hover:bg-bloom-red-blue-light h-6 bg-bloom-blue text-white",
            )}
            onClick={onStatusChange}
          >
            Set active
          </Button>
        )}
      </div>
    </div>
  );
}

export { AdminRoomCard, BookingRoomCard, RoomCard };
