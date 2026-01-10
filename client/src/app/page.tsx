"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";

import SearchRoomForm, {
  RoomSearchSchema,
  RoomSearchSchemaValue,
} from "@/app/search-room-form";

export default function Home() {
  const form = useForm<RoomSearchSchemaValue>({
    resolver: zodResolver(RoomSearchSchema),
    mode: "onChange",
  });

  // Handle search form submission
  const onSubmit = (data: RoomSearchSchemaValue) => {
    alert("submitted data:\n" + JSON.stringify(data));
  };

  // Reset search form
  const onReset = () => {
    form.reset();
  };

  // Fetch Location Data & Amentities Data

  // Fetch Rooms (Scroll down to get next page)

  return (
    <div className="grid h-screen grid-cols-1 md:grid-cols-2">
      <div>
        <h1 className="title">Booking A Meeting Room</h1>
        <SearchRoomForm form={form} onSubmit={onSubmit} onReset={onReset} />
      </div>
      <div>
        <h2 className="title">Rooms Availability</h2>
      </div>
    </div>
  );
}
