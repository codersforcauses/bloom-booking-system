// Text, Number, Select, Date, Time, Badge, Search, are all variations of the Input field.
// To see how each one is used, refer to this page.
// Currently only the Date and Time field are NOT implemented.
"use client";
import React from "react";

import InputField from "@/components/input";

const FREQUENCIES = [
  { label: "Does not repeat", value: "dnr" },
  { label: "Daily", value: "daily" },
  { label: "Weekly on Monday", value: "weekly-mon" },
  {
    label: "Everyday Weekday (Monday to Friday)",
    value: "weekly-mon-tue-wed-thu-fri",
  },
  { label: "Custom...", value: "custom" },
];

export default function TestInputPage() {
  const [name, setName] = React.useState("");
  const [occurences, setOccurences] = React.useState("");
  const [frequency, setFrequency] = React.useState("");

  const [timeManual, setTimeManual] = React.useState("");
  const [timeSelect, setTimeSelect] = React.useState("");

  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const [searchValue, setSearchValue] = React.useState("");

  return (
    <div className="min-h-screen bg-[hsl(var(--secondary))] p-8">
      <div className="mx-auto max-w-lg space-y-6 rounded-lg border bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))] shadow-sm">
        <h2 className="title mb-4">Test Input Fields</h2>

        {/* Text input */}
        <InputField
          kind="text"
          label="Name"
          name="guestName"
          value={name}
          onChange={setName}
          placeholder="Text"
        />

        {/* Number input */}
        <InputField
          kind="number"
          label="Occurences"
          name="occurences"
          value={occurences}
          onChange={setOccurences}
          placeholder="Number"
        />

        {/* Select input */}
        <InputField
          kind="select"
          label="Frequency"
          name="frequency"
          options={FREQUENCIES}
          value={frequency}
          onChange={setFrequency}
          placeholder="Select frequency"
        />

        {/* Time (manual HH:MM) */}
        <InputField
          kind="time"
          label="Start Time"
          name="startTimeManual"
          value={timeManual}
          onChange={setTimeManual}
          placeholder="HH:MM"
        />

        {/* Time-Select (08:00–17:00, 30-min intervals) */}
        <InputField
          kind="time-select"
          label="End Time"
          name="startTimeSelect"
          value={timeSelect}
          onChange={setTimeSelect}
          placeholder="Select a time"
        />

        {/* Date input */}
        <InputField
          kind="date"
          label="Date"
          name="bookingDate"
          value={date}
          onChange={setDate}
          placeholder="Select date"
        />

        <InputField
          kind="search"
          name="search"
          label="Search Bookings"
          value={searchValue}
          placeholder="Search here"
          onSearch={(val) => setSearchValue(val)}
        />
      </div>
    </div>
  );
}
