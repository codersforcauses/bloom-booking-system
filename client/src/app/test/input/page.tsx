// Text fields, Dropdown Menus, Date Fields, Time Fields, Badge Fields, are all variations of the Input field.
// To see how each one is used, refer to this page.
// Currently only the Text and Badge field has been implemented.

"use client";
import React from "react";

import InputField from "@/components/ui/input";

const AMENITIES = [
  "Audio",
  "Video",
  "White Board",
  "HDMI",
  "Projector",
  "Speaker Phone",
];

export default function TestInputPage() {
  const [name, setName] = React.useState("");
  const [amenities, setAmenities] = React.useState<string[]>([]);

  return (
    <div className="min-h-screen bg-[hsl(var(--secondary))] p-8">
      <div className="mx-auto max-w-lg space-y-6 rounded-lg border bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))] shadow-sm">
        <h2 className="title mb-4">Test Input Fields</h2>

        {/* Text input */}
        <InputField
          label="Name"
          name="guestName"
          value={name}
          onChange={setName}
        />

        {/* Badge input */}
        <InputField
          kind="badge"
          label="Amenities"
          name="amenities"
          options={AMENITIES}
          value={amenities}
          onChange={setAmenities}
        />
      </div>
    </div>
  );
}
