// src/stories/input.stories.tsx

import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useEffect, useState } from "react";

import InputField, { SelectOption } from "@/components/input";

const meta: Meta = {
  title: "Form/InputField",
};

export default meta;

type Story = StoryObj;

/* ----------------------------
   Options
---------------------------- */

const selectOptions: SelectOption[] = [
  { label: "Meeting Room A", value: "a" },
  { label: "Meeting Room B", value: "b" },
  { label: "Meeting Room C", value: "c" },
  { label: "Disabled option", value: "d", disabled: true },
];

const longSelectOptions: SelectOption[] = [
  {
    label:
      "Meeting Room A — Quarterly Planning & Cross-Functional Stakeholder Alignment (APAC + EMEA + Americas)",
    value: "a",
  },
  {
    label:
      "Meeting Room B — Visitor Access Required — Near Lift Lobby — Long Label For Overflow Testing",
    value: "b",
  },
  {
    label:
      "Meeting Room C — Ultra Wide Dual Display Video Conferencing Setup With Ceiling Microphones",
    value: "c",
  },
];

const badgeOptions = [
  "Audio",
  "HDMI",
  "White Board",
  "Projector",
  "Video Conferencing",
  "Air Conditioning",
];

const longBadgeOptions = [
  "Ultra Wide Dual Display Video Conferencing Setup With Ceiling Microphones And Noise Cancellation",
  "Wireless Presentation (AirPlay + Miracast + HDMI Dongle) With Auto Source Switching",
  "Height Adjustable Standing Desks (x12) With Cable Management Channels And Spare Power Bricks",
  "Accessibility Seating + Hearing Loop + Braille Signage + Wide Door Clearance",
  "Whiteboards (x4) + Marker Set + Eraser + Cleaning Spray + Replacement Pens In Drawer",
  "Coffee Machine (Bean-to-cup) + Fridge + Filtered Water Tap (Maintenance Required)",
];

/* ----------------------------
   Interactive (all variations)
---------------------------- */

type InteractiveArgs = {
  required: boolean;
  showError: boolean;
  useLongOptions: boolean;

  text: string;
  number: string;
  select: string;
  badge: string[];
  dateISO: string; // "" => undefined
  time: string;
  timeSelect: string;
  search: string;
};

export const Interactive: StoryObj<InteractiveArgs> = {
  args: {
    required: false,
    showError: false,
    useLongOptions: false,

    text: "Hello",
    number: "10",
    select: "a",
    badge: ["Audio"],
    dateISO: "",
    time: "08:30",
    timeSelect: "08:00",
    search: "query",
  },
  argTypes: {
    required: { control: "boolean" },
    showError: { control: "boolean" },
    useLongOptions: { control: "boolean" },

    text: { control: "text" },
    number: { control: "text" },
    select: { control: "text" },
    badge: { control: "object" },
    dateISO: { control: "text" },
    time: { control: "text" },
    timeSelect: { control: "text" },
    search: { control: "text" },
  },
  render: (args) => {
    const Wrapper = () => {
      const options = args.useLongOptions ? longSelectOptions : selectOptions;
      const badges = args.useLongOptions ? longBadgeOptions : badgeOptions;

      const [text, setText] = useState(args.text);
      const [number, setNumber] = useState(args.number);
      const [select, setSelect] = useState(args.select);
      const [badge, setBadge] = useState<string[]>(args.badge ?? []);
      const [date, setDate] = useState<Date | undefined>(
        args.dateISO ? new Date(args.dateISO) : undefined,
      );
      const [time, setTime] = useState(args.time);
      const [timeSelect, setTimeSelect] = useState(args.timeSelect);
      const [search, setSearch] = useState(args.search);

      // sync when controls change
      useEffect(() => setText(args.text), [args.text]);
      useEffect(() => setNumber(args.number), [args.number]);
      useEffect(() => setSelect(args.select), [args.select]);
      useEffect(() => setBadge(args.badge ?? []), [args.badge]);
      useEffect(
        () => setDate(args.dateISO ? new Date(args.dateISO) : undefined),
        [args.dateISO],
      );
      useEffect(() => setTime(args.time), [args.time]);
      useEffect(() => setTimeSelect(args.timeSelect), [args.timeSelect]);
      useEffect(() => setSearch(args.search), [args.search]);

      const error = args.showError ? "Example error message" : undefined;
      const required = args.required;

      return (
        <div className="max-w-2xl space-y-6">
          <InputField
            name="text"
            label="Text"
            kind="text"
            value={text}
            onChange={setText}
            required={required}
            error={error}
            placeholder="Text"
          />

          <InputField
            name="number"
            label="Number"
            kind="number"
            value={number}
            onChange={setNumber}
            required={required}
            error={error}
            placeholder="Number"
            min={0}
            max={999}
            step={1}
          />

          <InputField
            name="select"
            label="Select"
            kind="select"
            value={select}
            onChange={setSelect}
            required={required}
            error={error}
            placeholder="Select an option"
            options={options}
          />

          <InputField
            name="badge"
            label="Badge"
            kind="badge"
            value={badge}
            onChange={setBadge}
            required={required}
            error={error}
            placeholder="Select amenities"
            options={badges}
          />

          <InputField
            name="date"
            label="Date"
            kind="date"
            value={date}
            onChange={setDate}
            required={required}
            error={error}
            placeholder="Select date"
          />

          <InputField
            name="time"
            label="Time (HH:MM)"
            kind="time"
            value={time}
            onChange={setTime}
            required={required}
            error={error}
            placeholder="HH:MM"
          />

          <InputField
            name="timeSelect"
            label="Time Select"
            kind="time-select"
            value={timeSelect}
            onChange={setTimeSelect}
            required={required}
            error={error}
            placeholder="Select a time"
          />

          <InputField
            name="search"
            label="Search"
            kind="search"
            value={search}
            onSearch={setSearch}
            required={required}
            error={error}
            placeholder="Search..."
          />

          <div className="rounded-md border bg-white p-3 text-xs text-gray-500">
            <div className="font-semibold text-gray-700">Current values</div>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(
                {
                  text,
                  number,
                  select,
                  badge,
                  date: date ? date.toISOString() : null,
                  time,
                  timeSelect,
                  search,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      );
    };

    return (
      <div className="p-8">
        <Wrapper />
      </div>
    );
  },
};

/* ----------------------------
   Long values (all variations)
---------------------------- */

export const LongValues: Story = {
  name: "Long values",
  render: () => {
    const Wrapper = () => {
      const [text, setText] = useState(
        "Meeting Room A — Quarterly Planning & Cross-Functional Stakeholder Alignment Session (APAC + EMEA + Americas) — Very Long Input Value For Wrapping/Overflow Testing",
      );
      const [number, setNumber] = useState("9999");
      const [select, setSelect] = useState("b");
      const [badge, setBadge] = useState<string[]>([
        longBadgeOptions[0],
        longBadgeOptions[1],
        longBadgeOptions[2],
      ]);
      const [date, setDate] = useState<Date | undefined>(
        new Date("2026-02-09T00:00:00.000Z"),
      );
      const [time, setTime] = useState("23:59");
      const [timeSelect, setTimeSelect] = useState("17:00");
      const [search, setSearch] = useState(
        "ultra wide dual display ceiling microphones noise cancellation wireless presentation accessibility seating whiteboards coffee machine",
      );

      return (
        <div className="max-w-2xl space-y-6">
          <InputField
            name="text"
            label="Text"
            kind="text"
            value={text}
            onChange={setText}
            required
          />

          <InputField
            name="number"
            label="Number"
            kind="number"
            value={number}
            onChange={setNumber}
          />

          <InputField
            name="select"
            label="Select"
            kind="select"
            value={select}
            onChange={setSelect}
            options={longSelectOptions}
          />

          <InputField
            name="badge"
            label="Badge"
            kind="badge"
            value={badge}
            onChange={setBadge}
            options={longBadgeOptions}
          />

          <InputField
            name="date"
            label="Date"
            kind="date"
            value={date}
            onChange={setDate}
          />

          <InputField
            name="time"
            label="Time (HH:MM)"
            kind="time"
            value={time}
            onChange={setTime}
          />

          <InputField
            name="timeSelect"
            label="Time Select"
            kind="time-select"
            value={timeSelect}
            onChange={setTimeSelect}
          />

          <InputField
            name="search"
            label="Search"
            kind="search"
            value={search}
            onSearch={setSearch}
          />
        </div>
      );
    };

    return (
      <div className="p-8">
        <Wrapper />
      </div>
    );
  },
};
