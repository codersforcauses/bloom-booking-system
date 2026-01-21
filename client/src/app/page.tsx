"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import SearchRoomForm, {
  RoomSearchSchema,
  type RoomSearchSchemaValue,
} from "@/app/search-room-form";
import { BookingRoomCard } from "@/components/room-card";
import api from "@/lib/api";

// helper function to bridge the gap between api room data and arguments of BookingRoomCard
export const normalizedRooms = (apiRooms: any[]) => {
  return apiRooms.map((apiRoom) => ({
    id: apiRoom.id,
    title: apiRoom.name,
    image: apiRoom.img ?? "/placeholder.jpg",
    location: apiRoom.location.name,
    seats: apiRoom.capacity,
    amenities:
      apiRoom.amenities?.map(
        (amenity: Record<string, string>) => amenity.name,
      ) ?? [],
    available: true, // suppose that availability handled by the backend
  }));
};

export default function Home() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]); // todo: substitute any with the actual type
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<RoomSearchSchemaValue>({
    resolver: zodResolver(RoomSearchSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      location: "",
      fromDate: new Date(),
      fromTime: "",
      toDate: new Date(),
      toTime: "",
      amenities: [],
      minSeats: undefined,
      maxSeats: undefined,
    },
  });

  // Handle search form submission

  async function onSubmit(data: RoomSearchSchemaValue) {
    const params: Record<string, any> = {};

    // name search
    if (data.name) params.name = data.name;

    // location search - location id to name
    if (data.location) params.location = data.location;

    // amenities - name
    if (data.amenities?.length) {
      params.amenities = data.amenities.join(",");
    }

    // capacity range
    if (data.minSeats != null) params.min_capacity = data.minSeats;
    if (data.maxSeats != null) params.max_capacity = data.maxSeats;

    await fetchRooms("/rooms/", params);
  }

  // Reset search form and initial roomlist
  const onReset = () => {
    fetchRooms("/rooms/");
    form.reset();
    fetchRooms("/rooms/");
  };

  // Fetch Location Data & Amentities Data

  // Fetch Rooms (Scroll down to get next page)
  const fetchRooms = async (url: string, params?: Record<string, any>) => {
    const { data } = await api.get(url, { params });
    const newRooms = normalizedRooms(data.results);
    console.log(data);
    // if it is not the first page, append the data to the previous
    if (!data.previous) {
      setRooms(newRooms);
    } else {
      setRooms((prev) => [...prev, ...newRooms]);
    }
    // set next url to prepare for pagination
    setNextUrl(data.next);
  };

  // initial load
  useEffect(() => {
    fetchRooms("/rooms/");
  }, []);

  // handle pagination
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver((observedItems) => {
      const marker = observedItems[0];
      if (marker.isIntersecting && nextUrl) {
        // if the marker is visible and nextUrl exists
        fetchRooms(nextUrl);
      }
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [nextUrl]);

  return (
    <div className="grid h-screen grid-cols-1 gap-4 p-4 md:grid-cols-3 md:gap-8 md:p-8">
      <div className="md:col-span-1">
        <h1 className="title mb-4">Booking A Meeting Room</h1>

        <SearchRoomForm form={form} onSubmit={onSubmit} onReset={onReset} />
      </div>

      <div className="md:col-span-2">
        <h2 className="title mb-4">Rooms Availability</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <BookingRoomCard
                key={room.id}
                room={room}
                onBook={() => router.push(`/book-room/${room.id}`)} // todo: to substitute with the correct route
              />
            ))
          ) : (
            <p>No rooms found. Please try again.</p>
          )}
          {/* an invisible marker that trigger fetch when scrolling into view */}
          <div ref={loadMoreRef} style={{ height: 1 }} />
        </div>
      </div>
    </div>
  );
}
