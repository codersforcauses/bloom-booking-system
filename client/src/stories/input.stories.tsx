import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";

import InputField, { SelectOption } from "@/components/input";

const meta: Meta = {
  title: "Form/InputField",
  argTypes: {
    kind: {
      control: "select",
      options: [
        "text",
        "number",
        "select",
        "badge",
        "date",
        "time",
        "time-select",
        "search",
      ],
    },
  },
};

export default meta;

type Story = StoryObj;

const selectOptions: SelectOption[] = [
  { label: "Meeting Room A", value: "a" },
  { label: "Meeting Room B", value: "b" },
  { label: "Meeting Room C", value: "c" },
];

const badgeOptions = ["Audio", "HDMI", "White Board", "Projector"];

export const Interactive: Story = {
  render: (args: any) => {
    const Wrapper = () => {
      const [text, setText] = useState("Hello");
      const [number, setNumber] = useState("10");
      const [select, setSelect] = useState("a");
      const [badges, setBadges] = useState<string[]>(["Audio"]);
      const [date, setDate] = useState<Date | undefined>(undefined);
      const [time, setTime] = useState("08:30");
      const [timeSelect, setTimeSelect] = useState("08:00");
      const [search, setSearch] = useState("");

      switch (args.kind) {
        case "number":
          return (
            <InputField
              name="number"
              label="Number"
              kind="number"
              value={number}
              onChange={(v) => setNumber(v)}
            />
          );

        case "select":
          return (
            <InputField
              name="select"
              label="Select"
              kind="select"
              value={select}
              onChange={(v) => setSelect(v)}
              options={selectOptions}
            />
          );

        case "badge":
          return (
            <InputField
              name="badge"
              label="Badge"
              kind="badge"
              value={badges}
              onChange={(v) => setBadges(v)}
              options={badgeOptions}
            />
          );

        case "date":
          return (
            <InputField
              name="date"
              label="Date"
              kind="date"
              value={date}
              onChange={(v) => setDate(v)}
            />
          );

        case "time":
          return (
            <InputField
              name="time"
              label="Time"
              kind="time"
              value={time}
              onChange={(v) => setTime(v)}
            />
          );

        case "time-select":
          return (
            <InputField
              name="time-select"
              label="Time Select"
              kind="time-select"
              value={timeSelect}
              onChange={(v) => setTimeSelect(v)}
            />
          );

        case "search":
          return (
            <InputField
              name="search"
              label="Search"
              kind="search"
              value={search}
              onSearch={(v) => setSearch(v)}
            />
          );

        default:
          return (
            <InputField
              name="text"
              label="Text"
              kind="text"
              value={text}
              onChange={(v) => setText(v)}
            />
          );
      }
    };

    return (
      <div className="max-w-md">
        <Wrapper />
      </div>
    );
  },
};
