"use client";

import { useEffect, useState } from "react";

import { RoomCard } from "@/components/room-card";
import api from "@/lib/api";
import { Room } from "@/types/card";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);

  async function fetchRooms() {
    const apiUrl = "/rooms/";
    await api({ url: apiUrl, method: "get" })
      .then((response) => {
        const mappedRooms = mapRooms(response.data.results);

        setRooms(mappedRooms);
        console.log(response.data.results);
      })
      .catch((error) => {
        console.error("Error fetching rooms:", error);
      });
  }

  // Bandaid fix need to change component paramters to match api response
  function mapRooms(data: any[]) {
    return data.map((r: any) => ({
      title: r.name || "Untitled Room",
      image: r.img || "/rooms/default.jpg",
      location: r.location?.name || "Unknown",
      seats: r.capacity ?? 0,
      amenities: r.amenities || [],
      available: r.is_active ?? false,
      bookings: 0,
      removed: false,
      id: r.id,
    }));
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {rooms.map((room: Room, index: number) => (
        <RoomCard key={index} room={room} />
      ))}
    </div>
  );
}
