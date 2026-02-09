// src/stories/room-card.stories.tsx

import type { Meta, StoryObj } from "@storybook/nextjs";

import {
  AdminRoomCard,
  BookingRoomCard,
  RoomCard,
} from "@/components/room-card";
import type { Room } from "@/types/card";

const baseRoom: Room = {
  id: 1,
  title: "Meeting Room A",
  image: "",
  location: "Level 2 — Block B",
  available: true,
  availablility: "Available",
  seats: 10,
  amenities: ["Audio", "HDMI", "White Board"],
  bookings: 3,
  removed: false,
};

// wrappers
const Page = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#F9F9F9] px-10 py-5">{children}</div>
);
const SingleCard = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-sm">{children}</div>
);
const AdminGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid min-w-80 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {children}
  </div>
);

type RoomControls = {
  title: string;
  location: string;
  seats: number;
  available: boolean;
  availabilityText: string;
  amenitiesCSV: string;
  bookings: number;
  removed: boolean;
  imageUrl: string;
};

const meta: Meta = {
  title: "Booking/Room Cards",
  decorators: [
    (Story) => (
      <Page>
        <Story />
      </Page>
    ),
  ],
  argTypes: {
    seats: { control: { type: "number", min: 0, step: 1 } },
    available: { control: "boolean" },
    removed: { control: "boolean" },
    bookings: { control: { type: "number", min: 0, step: 1 } },
    title: { control: "text" },
    location: { control: "text" },
    availabilityText: { control: "text" },
    amenitiesCSV: { control: "text" },
    imageUrl: { control: "text" },
  },
};

export default meta;

type Story = StoryObj;

/* ----------------------------
   Interactive (PM-friendly)
---------------------------- */

export const RoomCard_Interactive: StoryObj<RoomControls> = {
  name: "RoomCard / Interactive",
  args: {
    title: baseRoom.title,
    location: baseRoom.location,
    seats: baseRoom.seats,
    available: baseRoom.available,
    availabilityText: baseRoom.availablility ?? "",
    amenitiesCSV: baseRoom.amenities.join(", "),
    bookings: baseRoom.bookings ?? 0,
    removed: baseRoom.removed ?? false,
    imageUrl: "", // empty => placeholder
  },
  render: (args) => {
    const amenities = args.amenitiesCSV
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const room: Room = {
      ...baseRoom,
      title: args.title,
      location: args.location,
      seats: args.seats,
      available: args.available,
      availablility: args.availabilityText,
      amenities,
      bookings: args.bookings,
      removed: args.removed,
      image: args.imageUrl,
    };

    return (
      <SingleCard>
        <RoomCard room={room} />
      </SingleCard>
    );
  },
};

/* ----------------------------
   RoomCard preset edge-cases
---------------------------- */

export const RoomCard_NoAmenities: StoryObj<typeof RoomCard> = {
  name: "RoomCard / No amenities",
  render: () => (
    <SingleCard>
      <RoomCard room={{ ...baseRoom, amenities: [] }} />
    </SingleCard>
  ),
};

export const RoomCard_UnknownAmenities: StoryObj<typeof RoomCard> = {
  name: "RoomCard / Unknown amenities",
  render: () => (
    <SingleCard>
      <RoomCard
        room={{
          ...baseRoom,
          amenities: ["Laser Projector", "Coffee Machine", "Audio"], // should fall back to Default icon/text handling
        }}
      />
    </SingleCard>
  ),
};

export const RoomCard_LongStrings: StoryObj<typeof RoomCard> = {
  name: "RoomCard / Long strings",
  render: () => (
    <SingleCard>
      <RoomCard
        room={{
          ...baseRoom,
          title:
            "Meeting Room A — Extremely Long Name For Wrapping/Overflow Testing",
          location:
            "Level 2 — Block B — A Very Long Location String To Check Layout Behaviour In The Grid",
          availablility: "Unavailable — maintenance in progress (ETA unknown)",
        }}
      />
    </SingleCard>
  ),
};

export const RoomCard_AvailabilityMissing: StoryObj<typeof RoomCard> = {
  name: "RoomCard / Availability missing",
  render: () => (
    <SingleCard>
      <RoomCard
        room={{
          ...baseRoom,
          availablility: undefined,
          available: false,
        }}
      />
    </SingleCard>
  ),
};

export const BookingRoomCard_Interactive: StoryObj<RoomControls> = {
  name: "BookingRoomCard / Interactive",
  args: {
    title: baseRoom.title,
    location: baseRoom.location,
    seats: baseRoom.seats,
    available: baseRoom.available,
    availabilityText: baseRoom.availablility ?? "",
    amenitiesCSV: baseRoom.amenities.join(", "),
    bookings: baseRoom.bookings ?? 0,
    removed: baseRoom.removed ?? false,
    imageUrl: "",
  },
  render: (args) => {
    const amenities = args.amenitiesCSV
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const room: Room = {
      ...baseRoom,
      title: args.title,
      location: args.location,
      seats: args.seats,
      available: args.available,
      availablility: args.availabilityText,
      amenities,
      bookings: args.bookings,
      removed: args.removed,
      image: args.imageUrl,
    };

    return (
      <SingleCard>
        <BookingRoomCard room={room} onBook={() => {}} />
      </SingleCard>
    );
  },
};

export const AdminRoomCard_Interactive: StoryObj<RoomControls> = {
  name: "AdminRoomCard / Interactive",
  args: {
    title: baseRoom.title,
    location: baseRoom.location,
    seats: baseRoom.seats,
    available: baseRoom.available,
    availabilityText: baseRoom.availablility ?? "",
    amenitiesCSV: baseRoom.amenities.join(", "),
    bookings: baseRoom.bookings ?? 0,
    removed: baseRoom.removed ?? false,
    imageUrl: "",
  },
  render: (args) => {
    const amenities = args.amenitiesCSV
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const room: Room = {
      ...baseRoom,
      title: args.title,
      location: args.location,
      seats: args.seats,
      available: args.available,
      availablility: args.availabilityText,
      amenities,
      bookings: args.bookings,
      removed: args.removed,
      image: args.imageUrl,
    };

    return (
      <SingleCard>
        <AdminRoomCard
          room={room}
          hideIcon={false}
          onView={() => {}}
          onEdit={() => {}}
          onRemove={() => {}}
        />
      </SingleCard>
    );
  },
};

/* ----------------------------
   Static regression stories
---------------------------- */

export const Admin_Grid_Example: Story = {
  name: "AdminRoomCard / Grid (page-like)",
  render: () => (
    <AdminGrid>
      {Array.from({ length: 8 }).map((_, i) => (
        <AdminRoomCard
          key={i}
          room={{
            ...baseRoom,
            id: i + 1,
            title: `Meeting Room ${String.fromCharCode(65 + i)}`,
            bookings: i * 2,
            removed: i === 6,
          }}
          onView={() => {}}
          onEdit={() => {}}
          onRemove={() => {}}
        />
      ))}
    </AdminGrid>
  ),
};
