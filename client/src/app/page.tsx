"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useCallback,useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import SearchRoomForm, {
  RoomSearchSchema,
  type RoomSearchSchemaValue,
} from "@/app/search-room-form";
import { BookingRoomCard } from "@/components/room-card";
import api from "@/lib/api";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='20'>No image</text></svg>";

// helper function to bridge the gap between api room data and arguments of BookingRoomCard
export function normalizeRooms(apiRooms: any[]) {
  return apiRooms.map((apiRoom) => ({
    id: apiRoom.id,
    title: apiRoom.name,
    image: apiRoom.img ?? PLACEHOLDER_IMAGE,
    location: apiRoom.location.name,
    seats: apiRoom.capacity,
    amenities:
      apiRoom.amenities?.map(
        (amenity: Record<string, string>) => amenity.name,
      ) ?? [],
    available: true, // suppose that availability handled by the backend
  }));
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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

    // to do: date & time filtering logic to be confirmed with backend team

    await fetchRooms("/rooms/", params);
  }

  // Reset search form and initial roomlist
  const onReset = () => {
    form.reset();
    fetchRooms("/rooms/");
  };

  // Fetch Rooms (Scroll down to get next page)
  const fetchRooms = useCallback(
    async (url: string, params?: Record<string, any>) => {
      setLoading(true);
      try {
        const { data } = await api.get(url, { params });
        const newRooms = normalizeRooms(data.results);
        // if it is not the first page, append the data to the previous
        if (!data.previous) {
          setRooms(newRooms);
        } else {
          setRooms((prev) => [...prev, ...newRooms]);
        }
        // set next url to prepare for pagination
        setNextUrl(data.next);
      } catch (error) {
        console.error("Failed to fetch rooms", error);
        // Reset to a safe empty state on error
        setRooms([]);
        setNextUrl(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // initial load
  useEffect(() => {
    fetchRooms("/rooms/");
  }, []);

  // handle pagination
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver((observedItems) => {
      const marker = observedItems[0];
      if (marker.isIntersecting && nextUrl && !loading) {
        // if the marker is visible, nextUrl exists, and no fetch is in progress
        fetchRooms(nextUrl);
      }
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [nextUrl, loading, fetchRooms]);

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 p-4 md:grid-cols-2 md:gap-8 md:p-8 lg:grid-cols-5">
      <div className="col-span-1 lg:col-span-2">
        <h1 className="title mb-4">Booking a Meeting Room</h1>
        <SearchRoomForm form={form} onSubmit={onSubmit} onReset={onReset} />
      </div>

      <div className="col-span-1 lg:col-span-3">
        <h2 className="title mb-4">Rooms Availability</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {rooms.length > 0
            ? rooms.map((room) => (
                <BookingRoomCard
                  key={room.id}
                  room={room}
                  onBook={() => router.push(`/book-room/${room.id}`)} // todo: to substitute with the correct route
                />
              ))
            : !loading && (
                <p className="col-span-1 lg:col-span-3">
                  No rooms found. Please try again.
                </p>
              )}
          {/* an invisible marker that trigger fetch when scrolling into view */}
          <div ref={loadMoreRef} style={{ height: 1 }} />
        </div>
      </div>
    </div>
  );
}
