// src/stories/combobox.stories.tsx

import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";

import Combobox from "@/components/combobox";

type Item = {
  id: string | number;
  name: string;
};

const meta: Meta = {
  title: "Form/Combobox",
};

export default meta;

type Story = StoryObj;

/* ----------------------------
   Data
---------------------------- */

const items: Item[] = [
  { id: 1, name: "Projector" },
  { id: 2, name: "HDMI" },
  { id: 3, name: "White Board" },
  { id: 4, name: "Audio" },
  { id: 5, name: "Video Conferencing" },
  { id: 6, name: "Air Conditioning" },
];

const longItems: Item[] = [
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
  {
    id: 14,
    name: "Coffee Machine (Bean-to-cup) + Fridge + Filtered Water Tap (Maintenance Required)",
  },
];

/* ----------------------------
   Stories
---------------------------- */

export const Interactive: Story = {
  render: () => {
    const Wrapper = () => {
      const [values, setValues] = useState<string[]>(["Projector"]);

      return (
        <div className="p-8">
          <div className="max-w-xl space-y-4">
            <Combobox
              name="amenities"
              items={items}
              values={values}
              onValueChange={setValues}
            />

            <div className="rounded-md border bg-white p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-800">Selected</div>
              <pre className="mt-2 whitespace-pre-wrap">
                {JSON.stringify(values, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      );
    };

    return <Wrapper />;
  },
};

export const Empty: Story = {
  render: () => {
    const Wrapper = () => {
      const [values, setValues] = useState<string[]>([]);

      return (
        <div className="p-8">
          <div className="max-w-xl">
            <Combobox
              name="amenities"
              items={[]}
              values={values}
              onValueChange={setValues}
              isLoading={false}
            />
          </div>
        </div>
      );
    };

    return <Wrapper />;
  },
};

export const Loading: Story = {
  render: () => {
    const Wrapper = () => {
      const [values, setValues] = useState<string[]>([]);

      return (
        <div className="p-8">
          <div className="max-w-xl">
            <Combobox
              name="amenities"
              items={[]}
              values={values}
              onValueChange={setValues}
              isLoading
            />
          </div>
        </div>
      );
    };

    return <Wrapper />;
  },
};

export const LongValues: Story = {
  name: "Long values",
  render: () => {
    const Wrapper = () => {
      const [values, setValues] = useState<string[]>([
        longItems[0].name,
        longItems[1].name,
      ]);

      return (
        <div className="p-8">
          <div className="max-w-2xl space-y-4">
            <Combobox
              name="amenities"
              items={longItems}
              values={values}
              onValueChange={setValues}
            />

            <div className="rounded-md border bg-white p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-800">Selected</div>
              <pre className="mt-2 whitespace-pre-wrap">
                {JSON.stringify(values, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      );
    };

    return <Wrapper />;
  },
};
