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
  availability: "Available",
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

const makeRoom = (args: RoomControls): Room => {
  const amenities = args.amenitiesCSV
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    ...baseRoom,
    title: args.title,
    location: args.location,
    seats: args.seats,
    available: args.available,
    availability: args.availabilityText,
    amenities,
    bookings: args.bookings,
    removed: args.removed,
    image: args.imageUrl,
  };
};

const normalArgs: RoomControls = {
  title: baseRoom.title,
  location: baseRoom.location,
  seats: baseRoom.seats,
  available: baseRoom.available,
  availabilityText: baseRoom.availability ?? "",
  amenitiesCSV: baseRoom.amenities.join(", "),
  bookings: baseRoom.bookings ?? 0,
  removed: baseRoom.removed ?? false,
  imageUrl: "",
};

const longArgs: RoomControls = {
  title:
    "Meeting Room A — Quarterly Planning & Cross-Functional Stakeholder Alignment Session (APAC + EMEA + Americas)",
  location:
    "Level 2 — Block B — North Wing — Adjacent to Reception — Near Lift Lobby — Building 7 — Campus West (Visitor Access Required)",
  seats: 120,
  available: true,
  availabilityText:
    "Available (Limited) — please confirm catering, security access, and A/V technician availability before booking",
  amenitiesCSV:
    "Audio, HDMI, White Board, Video Conferencing, Dual Displays, Ceiling Mics, Wireless Presentation, Standing Desks, Accessibility Seating, Cable Management, Spare Chargers, Air Conditioning",
  bookings: 999,
  removed: false,
  imageUrl:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=60",
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
   RoomCard (3 stories)
---------------------------- */

export const RoomCard_Interactive: StoryObj<RoomControls> = {
  name: "RoomCard / Interactive",
  args: normalArgs,
  render: (args) => (
    <SingleCard>
      <RoomCard room={makeRoom(args)} />
    </SingleCard>
  ),
};

export const RoomCard_Long: StoryObj = {
  name: "RoomCard / Long",
  render: () => (
    <SingleCard>
      <RoomCard room={makeRoom(longArgs)} />
    </SingleCard>
  ),
};

/* ----------------------------
   BookingRoomCard (3 stories)
---------------------------- */

export const BookingRoomCard_Interactive: StoryObj<RoomControls> = {
  name: "BookingRoomCard / Interactive",
  args: normalArgs,
  render: (args) => (
    <SingleCard>
      <BookingRoomCard room={makeRoom(args)} onBook={() => {}} />
    </SingleCard>
  ),
};

export const BookingRoomCard_Long: StoryObj = {
  name: "BookingRoomCard / Long",
  render: () => (
    <SingleCard>
      <BookingRoomCard room={makeRoom(longArgs)} onBook={() => {}} />
    </SingleCard>
  ),
};

/* ----------------------------
   AdminRoomCard (3 stories)
---------------------------- */

export const AdminRoomCard_Interactive: StoryObj<RoomControls> = {
  name: "AdminRoomCard / Interactive",
  args: normalArgs,
  render: (args) => (
    <SingleCard>
      <AdminRoomCard
        room={makeRoom(args)}
        hideIcon={false}
        onView={() => {}}
        onEdit={() => {}}
      />
    </SingleCard>
  ),
};

export const AdminRoomCard_Long: StoryObj = {
  name: "AdminRoomCard / Long",
  render: () => (
    <SingleCard>
      <AdminRoomCard
        room={makeRoom(longArgs)}
        hideIcon={false}
        onView={() => {}}
        onEdit={() => {}}
      />
    </SingleCard>
  ),
};
