"use client";

import {
  AdminRoomCard,
  BookingRoomCard,
  RoomCard,
} from "@/components/room-card";
import { roomsMock } from "@/types/card";

export default function RoomsList() {
  return (
    <div className="w-full rounded-xl bg-gray-100 p-6">
      <h2 className="mb-4 text-xl font-semibold">Booking Rooms Display</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {roomsMock.map((room) => (
          <BookingRoomCard
            key={room.id}
            room={room}
            onBook={() => alert("Book")}
          />
        ))}
      </div>

      <div className="my-10 border-t border-gray-300"></div>

      <h2 className="mb-4 text-xl font-semibold">
        Admin Meeting Rooms Display
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {roomsMock.map((room) => (
          <AdminRoomCard
            key={room.id}
            room={room}
            onView={() => alert("View")}
            onEdit={() => alert("Edit")}
            onStatusChange={() => alert("Status Change")}
          />
        ))}
      </div>
      <div className="my-10 border-t border-gray-300"></div>

      <h2 className="mb-4 text-xl font-semibold">General Rooms Display</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {roomsMock.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}
