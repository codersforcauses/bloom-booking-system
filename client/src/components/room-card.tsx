"use client";

import Image from "next/image";
import { FaMicrophone } from "react-icons/fa";
import { GrStatusUnknown } from "react-icons/gr";
import { IoMdVideocam } from "react-icons/io";
import { LuHdmiPort } from "react-icons/lu";
import { MdPhonelinkRing } from "react-icons/md";
import { RiArtboardLine } from "react-icons/ri";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Room } from "@/types/card";

import { Button } from "./ui/button";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='20'>No image</text></svg>";

// Mapping amenity string -> React icon component
const amenityIcons: Record<string, React.JSX.Element> = {
  Default: <GrStatusUnknown size={16} />,
  Audio: <FaMicrophone size={16} />,
  Video: <IoMdVideocam size={16} />,
  HDMI: <LuHdmiPort size={16} />,
  "White Board": <RiArtboardLine size={16} />,
  "Sound System": <MdPhonelinkRing size={16} />,
};

/**
 * Renders a list of room amenities using icons or plain text.
 *
 * @param {Object} props
 * @param {string[]} props.amenities List of amenities to display.
 * @param {boolean} [props.hideIcon=true] If true, displays amenities as plain text.
 * @param {string} [props.className] Optional extra class names for styling.
 *
 * @example
 * <Amenities amenities={["Audio", "HDMI"]} />
 * <Amenities amenities={["White Board"]} hideIcon />
 */
const Amenities = ({
  amenities,
  hideIcon = true,
  className,
}: {
  amenities: string[];
  hideIcon?: boolean;
  className?: string;
}) => {
  if (hideIcon) {
    return <span className="text-[13px]">{amenities.join(", ")}</span>;
  }

  return (
    <div className={cn(className, "flex flex-wrap gap-2")}>
      {amenities.map((amenity) => (
        <div
          key={amenity}
          title={amenity}
          className="flex h-[24px] w-[24px] cursor-help items-center justify-center rounded-full border-[1.5px] border-bloom-orbit text-bloom-orbit transition"
        >
          {amenityIcons[amenity] || amenityIcons["Default"]}
        </div>
      ))}
    </div>
  );
};

/**
 * Displays a room with details in a label-value grid format.
 *
 * Shows image, room name, location, seats, amenities and availability.
 * Intended for general / admin use as an info card.
 *
 * @param {Object} props
 * @param {Room} props.room Room data object.
 *
 * @example
 * const room = {
 *   title: "Meeting Room A",
 *   image: "/rooms/a.jpg",
 *   location: "Level 2 Block B",
 *   seats: 10,
 *   amenities: ["Audio", "HDMI"],
 *   available: true,
 * };
 *
 * <RoomCard room={room} />
 */
function RoomCard({ room }: { room: Room; hideIcon?: boolean }) {
  const roomDetailsGroups = [
    { label: "Room Name", value: room.name },
    { label: "Location", value: room.location },
    { label: "No of Seats", value: room.capacity },
    {
      label: "Amenities",
      value: <Amenities amenities={room.amenities} hideIcon />,
    },
    {
      label: "Availability",
      value: room.is_active ? "Available" : "Not Available",
    },
  ];

  return (
    <div className="flex w-full flex-col bg-white shadow-sm">
      <div className="w-full p-4">
        <div className="relative h-40 w-full">
<<<<<<< HEAD
          <Image
            src={room.image || PLACEHOLDER_IMAGE} //  if room.image is null, render PLACEHOLDER_IMAGE
            alt={room.title}
            fill
            className="object-cover"
          />
=======
          <Image src={room.img} alt={room.name} fill className="object-cover" />
>>>>>>> b2398fe (Fix room type to match api response)
        </div>
      </div>

      {/* Info grid ensures perfect alignment */}
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
  hideIcon?: boolean;
  onBook?: () => void;
};

/**
 * User-facing booking card for displaying a room.
 *
 * Responsive: shows compact card on mobile, detailed card on desktop.
 * Includes image, title, location, facilities, availability, and a Book button.
 *
 * @param {Object} props
 * @param {Room} props.room Room data object.
 * @param {boolean} [props.hideIcon=false] Hide icons for amenities if true.
 * @param {() => void} [props.onBook] Callback when the Book button is clicked.
 *
 * @example
 * const room = {
 *   title: "Training Room B",
 *   image: "/rooms/b.jpg",
 *   location: "Level 3 Block D",
 *   seats: 12,
 *   amenities: ["Audio", "HDMI", "White Board"],
 *   available: true,
 * };
 *
 * <BookingRoomCard room={room} onBook={() => console.log("Booked!")} />
 */
function BookingRoomCard({ room, onBook }: BookingRoomProps) {
  // Default: User card view
  return (
    <Card className="flex w-full flex-col overflow-hidden rounded-xl border-black bg-white shadow-md">
      <div className="relative h-40 w-full">
<<<<<<< HEAD
        <Image
          src={room.image || PLACEHOLDER_IMAGE} //  if room.image is null, render PLACEHOLDER_IMAGE
          alt={room.title}
          fill
          className="object-cover"
        />
=======
        <Image src={room.img} alt={room.name} fill className="object-cover" />
>>>>>>> b2398fe (Fix room type to match api response)
      </div>

      <div className="flex flex-col gap-1 px-4 py-3">
        <span className="text-[14px] font-bold">{room.name}</span>
        <span className="text-[13px] font-semibold text-gray-400">
          {room.location}
        </span>
      </div>

      <div className="mt-auto flex justify-start px-4 pb-4">
<<<<<<< HEAD
        <Button variant="outline" onClick={onBook}>
          Book
=======
        <Button
          className="h-[38px] w-[88px] rounded-[10px] border border-black bg-white py-2 text-black hover:bg-gray-100"
          onClick={onBook}
        >
          {room.is_active ? "Book" : "Booked"}
>>>>>>> b2398fe (Fix room type to match api response)
        </Button>
      </div>
    </Card>
  );
}

type AdminRoomCardProps = {
  room: Room;
  hideIcon?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
};

/**
 * Admin card for managing room details.
 *
 * Displays full room info: name, location, capacity, amenities, and bookings.
 * Includes admin action buttons: View Bookings, Edit, Remove.
 * Supports disabling the Remove button if room is already removed.
 *
 * @param {Object} props
 * @param {Room} props.room Room data object.
 * @param {boolean} [props.hideIcon=false] Hide amenity icons if true.
 * @param {() => void} [props.onView] Callback for View Bookings button.
 * @param {() => void} [props.onEdit] Callback for Edit button.
 * @param {() => void} [props.onRemove] Callback for Remove button.
 *
 * @example
 * const room = {
 *   title: "Studio Room C",
 *   image: "/rooms/c.jpg",
 *   location: "Level 1 Block E",
 *   seats: 20,
 *   amenities: ["White Board", "Audio"],
 *   bookings: 10,
 *   removed: false,
 * };
 *
 * <AdminRoomCard
 *   room={room}
 *   onView={() => console.log("View")}
 *   onEdit={() => console.log("Edit")}
 *   onRemove={() => console.log("Remove")}
 * />
 */
function AdminRoomCard({
  room,
  hideIcon,
  onView,
  onEdit,
  onRemove,
}: AdminRoomCardProps) {
  const roomDetails = [
    { label: "Room Name", value: room.name },
    { label: "Location", value: room.location?.name ?? "N/A" },
    { label: "No of Seats", value: room.capacity },
    {
      label: "Amenities",
      value: (
        <Amenities
          amenities={room.amenities.map((a) => a.name)}
          hideIcon={hideIcon}
        />
      ),
    },
    // { label: "Bookings", value: room.bookings },
  ];

  const FALLBACK_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
      <rect width="100%" height="100%" fill="#f2f2f2"/>
      <rect x="60" y="70" width="680" height="360" rx="18" fill="#e6e6e6"/>
      <text x="50%" y="52%" text-anchor="middle" font-family="Arial" font-size="36" fill="#9a9a9a">
        Room
      </text>
    </svg>
  `);

  return (
    <div className="flex w-full flex-col overflow-hidden bg-white p-4 shadow-sm">
      {/* Room Image */}
      <div className="relative h-40 w-full">
        <Image
<<<<<<< HEAD
          src={room.image || PLACEHOLDER_IMAGE} //  if room.image is null, render PLACEHOLDER_IMAGE
          alt={room.title}
=======
          src={room.img ?? FALLBACK_IMG}
          alt={room.name}
>>>>>>> b2398fe (Fix room type to match api response)
          fill
          className="object-cover"
        />
      </div>

      {/* Room Details */}
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

      {/* Action Buttons */}
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
        <Button
          className={cn(
            "caption h-6 bg-bloom-red text-white hover:bg-bloom-red-light",
            room.is_active &&
              "cursor-not-allowed bg-gray-400 hover:bg-gray-400",
          )}
          onClick={onRemove}
          disabled={room.is_active}
        >
          {room.is_active ? "Removed" : "Remove"}
        </Button>
      </div>
    </div>
  );
}

export { AdminRoomCard, BookingRoomCard, RoomCard };
