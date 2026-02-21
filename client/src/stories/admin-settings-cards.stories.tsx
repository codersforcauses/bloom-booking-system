// src/stories/admin-settings-cards.stories.tsx

import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";

import {
  AdminSettingsFormCard,
  AdminSettingsSummaryCard,
  AdminSettingsTableCard,
} from "@/components/admin-settings-card"; // <-- adjust path if different
import type { AmenityResponse, LocationResponse } from "@/lib/api-types";

const meta: Meta = {
  title: "Admin/Admin Settings Cards",
};

export default meta;

type Story = StoryObj;

/* ----------------------------
   Helpers
---------------------------- */

const normalLocations = ["Building A", "Building B", "Library"];
const normalAmenities = ["Projector", "Whiteboard", "HDMI"];

const longLocations = [
  "Building 7 — Campus West — North Wing — Adjacent to Reception — Near Lift Lobby (Visitor Access Required)",
  "Engineering Complex — Level 4 — Room 4.21 — Restricted After Hours — Swipe Access Only",
  "Medical Sciences — Teaching Block — Long Corridor — End Door — Please Ring Bell For Entry",
  "Student Guild — Events Hall — Back Entrance — Past the Courtyard — Near the Loading Bay",
  "Business School — Innovation Hub — Hotdesk Zone — Quiet Area — Please Keep Voices Down",
  "Arts — Studio Annex — Paint Storage Side — Watch Your Step — Slippery When Wet",
];

const longAmenities = [
  "Ultra Wide Dual Display Video Conferencing Setup With Ceiling Microphones And Noise Cancellation",
  "Wireless Presentation (AirPlay + Miracast + HDMI Dongle) With Auto Source Switching",
  "Height Adjustable Standing Desks (x12) With Cable Management Channels And Spare Power Bricks",
  "Accessibility Seating + Hearing Loop + Braille Signage + Wide Door Clearance",
  "Whiteboards (x4) + Marker Set + Eraser + Cleaning Spray + Replacement Pens In Drawer",
  "Coffee Machine (Bean-to-cup) + Fridge + Filtered Water Tap (Maintenance Required)",
];

const normalTableItems: LocationResponse[] = [
  { id: 1, name: "Building A" },
  { id: 2, name: "Building B" },
  { id: 3, name: "Library" },
];

const longTableItems: AmenityResponse[] = [
  {
    id: 10,
    name: "Ultra Wide Dual Display Video Conferencing Setup With Ceiling Microphones And Noise Cancellation",
  },
  {
    id: 11,
    name: "Wireless Presentation (AirPlay + Miracast + HDMI Dongle) With Auto Source Switching",
  },
  {
    id: 12,
    name: "Accessibility Seating + Hearing Loop + Braille Signage + Wide Door Clearance",
  },
  {
    id: 13,
    name: "Whiteboards (x4) + Marker Set + Eraser + Cleaning Spray + Replacement Pens In Drawer",
  },
];

/* ----------------------------
   Summary Card
---------------------------- */

type SummaryArgs = {
  locations: string[];
  amenities: string[];
  isLoading: boolean;
};

export const Summary_Interactive: StoryObj<SummaryArgs> = {
  name: "Summary / Interactive",
  args: {
    locations: normalLocations,
    amenities: normalAmenities,
    isLoading: false,
  },
  render: (args) => (
    <div className="max-w-2xl">
      <AdminSettingsSummaryCard
        locations={args.locations}
        amenities={args.amenities}
        isLoading={args.isLoading}
        onEditLocations={() => {}}
        onEditAmenities={() => {}}
      />
    </div>
  ),
};

export const Summary_Long: Story = {
  name: "Summary / Long values",
  render: () => (
    <div className="max-w-2xl">
      <AdminSettingsSummaryCard
        locations={longLocations}
        amenities={longAmenities}
        isLoading={false}
        onEditLocations={() => {}}
        onEditAmenities={() => {}}
      />
    </div>
  ),
};

/* ----------------------------
   Table Card
---------------------------- */

type TableArgs = {
  title: string;
  items: Array<LocationResponse | AmenityResponse>;
};

export const Table_Interactive: StoryObj<TableArgs> = {
  name: "Table / Interactive",
  args: {
    title: "Room Locations",
    items: normalTableItems,
  },
  render: (args) => (
    <div className="max-w-2xl">
      <AdminSettingsTableCard
        title={args.title}
        // component expects AmenityResponse[] | LocationResponse[]
        items={args.items as any}
        onAdd={() => {}}
        onBack={() => {}}
        onEditItem={() => {}}
        onDeleteItem={() => {}}
      />
    </div>
  ),
};

export const Table_Long: Story = {
  name: "Table / Long values",
  render: () => (
    <div className="max-w-2xl">
      <AdminSettingsTableCard
        title="Room Amenities"
        items={longTableItems}
        onAdd={() => {}}
        onBack={() => {}}
        onEditItem={() => {}}
        onDeleteItem={() => {}}
      />
    </div>
  ),
};

/* ----------------------------
   Form Card
---------------------------- */

type FormArgs = {
  title: string;
  defaultValue: string;
};

export const Form_Interactive: StoryObj<FormArgs> = {
  name: "Form / Interactive",
  args: {
    title: "Room Location",
    defaultValue: "",
  },
  render: (args) => {
    // Keep the form "alive" in Storybook so typing feels normal.
    const Wrapper = () => {
      const [value, setValue] = useState(args.defaultValue);

      return (
        <div className="max-w-2xl">
          <AdminSettingsFormCard
            title={args.title}
            defaultValue={value}
            onCancel={() => {}}
            onSubmit={(v) => setValue(v)}
          />
        </div>
      );
    };

    return <Wrapper />;
  },
};

export const Form_Long: Story = {
  name: "Form / Long values",
  render: () => (
    <div className="max-w-2xl">
      <AdminSettingsFormCard
        title="Room Amenity"
        defaultValue="Ultra Wide Dual Display Video Conferencing Setup With Ceiling Microphones And Noise Cancellation"
        onCancel={() => {}}
        onSubmit={() => {}}
      />
    </div>
  ),
};
