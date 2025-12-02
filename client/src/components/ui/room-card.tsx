import Image from "next/image";
import { FaMicrophone } from "react-icons/fa";
import { GrStatusUnknown } from "react-icons/gr";
import { IoMdVideocam } from "react-icons/io";
import { LuHdmiPort } from "react-icons/lu";
import { MdPhonelinkRing } from "react-icons/md";
import { RiArtboardLine } from "react-icons/ri";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Room } from "@/types/card";

import { Button } from "./button";

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
 * Renders a list of amenities using icons or text.
 *
 * @param {Object} props
 * @param {string[]} props.amenities List of amenities to display.
 * @param {boolean} [props.hideIcon=false] If true, displays amenities as plain text.
 * @param {string} [props.className] Optional class for styling.
 *
 * @example
 * <Amenities amenities={["Audio", "HDMI"]} />
 * <Amenities amenities={["White Board"]} hideIcon />
 */
const Amenities = ({
  amenities,
  hideIcon = false,
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
          className="flex h-[24px] w-[24px] cursor-help items-center justify-center rounded-full border-[1.5px] border-[#437DD6] text-[#437DD6] transition"
        >
          {amenityIcons[amenity] || amenityIcons["Default"]}
        </div>
      ))}
    </div>
  );
};

/**
 * User view card for displaying a room with booking option.
 *
 * Shows image, title, location and a Book button.
 * Intended for general users who want to view and book rooms.
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
 *   bookings: 4,
 *   available: true
 * };
 *
 * <UserCard room={room} />
 */
function UserCard({ room }: { room: Room }) {
  return (
    <Card className="w-full overflow-hidden rounded-xl border-black bg-white shadow-md">
      <div className="relative h-40 w-full">
        <Image
          src={room.image}
          alt={room.title}
          fill
          className="object-cover"
        />
      </div>

      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-[14px] font-bold">{room.title}</CardTitle>
      </CardHeader>

      <CardContent className="pb-2">
        <span className="text-[13px] font-semibold text-[#888888]">
          {room.location}
        </span>
      </CardContent>

      <CardFooter className="pb-4">
        <Button className="h-[38px] w-[88px] rounded-[10px] border border-black bg-white py-2 text-black hover:bg-gray-100">
          Book
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Admin management card for room details.
 *
 * Displays full room information including
 * name, location, seats, amenities and bookings.
 * Includes admin action buttons for editing and removal.
 *
 * Used in admin dashboards to manage rooms.
 *
 * @param {Object} props
 * @param {Room} props.room Room data object.
 *
 * @example
 * const room = {
 *   title: "Studio Room C",
 *   image: "/rooms/c.jpg",
 *   location: "Level 1 Block E",
 *   seats: 20,
 *   amenities: ["White Board", "Audio"],
 *   bookings: 10,
 *   removed: false
 * };
 *
 * <AdminCard room={room} />
 */
function AdminCard({ room }: { room: Room; hideIcon?: boolean }) {
  const roomDetailsGroups = [
    { label: "Room Name", value: room.title },
    { label: "Location", value: room.location },
    { label: "No of Seats", value: room.seats },
    {
      label: "Amenities",
      value: <Amenities amenities={room.amenities} hideIcon />,
    },
    { label: "Bookings", value: room.bookings },
  ];

  return (
    <div className="w-full bg-white shadow-sm">
      <div className="w-full p-4">
        <div className="relative h-40 w-full">
          <Image
            src={room.image}
            alt={room.title}
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="space-y-4 px-4 pb-4">
        {roomDetailsGroups.map((item) => (
          <div key={item.label} className="flex text-[14px] font-medium">
            <span className="min-w-28 text-[#9C9C9C]">{item.label}</span>
            <span className="">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 px-4 pb-4">
        <Button className="h-[23px] bg-[#2332FF] px-2 text-[10px] hover:bg-[#437DD6]">
          View Bookings
        </Button>
        <Button className="h-[23px] bg-[#F3D03A] text-[10px] hover:bg-[#FFC400]">
          Edit
        </Button>
        <Button
          className={cn(
            "h-[23px] bg-[#BE1B3B] text-[10px] hover:bg-[#EB5757]",
            room.removed &&
              "cursor-not-allowed bg-[#9C9C9C] hover:bg-[#9C9C9C]",
          )}
        >
          {room.removed ? "Removed" : "Remove"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Mobile friendly version of the room card.
 *
 * Designed for small screens with grouped details.
 * Displays status, amenities and a booking button.
 *
 * @param {Object} props
 * @param {Room} props.room Room data object.
 *
 * @example
 * const room = {
 *   title: "Training Room D",
 *   image: "/rooms/d.jpg",
 *   location: "Level 4 Block A",
 *   seats: 30,
 *   amenities: ["Sound System", "HDMI"],
 *   bookings: 2,
 *   available: false
 * };
 *
 * <MobileCard room={room} />
 */
function MobileCard({ room }: { room: Room; hideIcon?: boolean }) {
  const roomDetailsGroups = [
    [
      { label: "Title", value: room.title },
      { label: "Seating Capacity:", value: room.seats },
    ],
    [
      { label: "Location:", value: room.location },
      { label: "Available", value: room.available },
    ],
    [
      {
        label: "Facilities:",
        value: <Amenities amenities={room.amenities} className="pl-2" />,
      },
    ],
  ];

  return (
    <div className="w-full space-y-4 rounded-lg bg-white px-12 pt-8 shadow-sm">
      <div className="w-full">
        <div className="relative h-40 w-full">
          <Image
            src={room.image}
            alt={room.title}
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="space-y-4">
        {roomDetailsGroups.map((group, i) => (
          <div
            key={i}
            className="flex justify-between gap-1 text-[10px] font-medium"
          >
            {group.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                {item.label === "Title" ? (
                  <span className="text-[14px]">{item.value}</span>
                ) : item.label === "Available" ? (
                  <span
                    className={cn(
                      item.value ? "text-[#17AF87]" : "text-[#EB5757]",
                    )}
                  >
                    {item.value ? "Available" : "Not Available"}
                  </span>
                ) : (
                  <>
                    <span>{item.label}</span>
                    <span className="text-[#9C9C9C]">{item.value}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex pb-4">
        <Button
          variant={room.available ? "default" : "outline"}
          className={cn(
            "h-[30px] w-[79px] text-[10px] font-bold",
            room.available
              ? "bg-[#2332FF] text-white hover:bg-[#437DD6]"
              : "cursor-not-allowed border-[#437DD6] text-[#437DD6] hover:bg-white",
          )}
        >
          {room.available ? "Book" : "Booked"}
        </Button>
      </div>
    </div>
  );
}

export { AdminCard, MobileCard, UserCard };
