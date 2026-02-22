"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import SearchRoomForm, {
  RoomSearchSchema,
  type RoomSearchSchemaValue,
} from "@/app/search-room-form";
import { BookingRoomCard } from "@/components/room-card";
import api from "@/lib/api";
import { normaliseRooms } from "@/lib/normalise-room";
import { Room } from "@/types/card";

type Params = {
  name?: string;
  location?: string;
  amenities?: string;
  min_capacity?: number;
  max_capacity?: number;
  start_datetime?: string;
  end_datetime?: string;
};

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [nextAvailabilityUrl, setNextAvailabilityUrl] = useState<string | null>(
    null,
  );
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lastSearchParams = useRef<RoomSearchSchemaValue | null>(null);

  const form = useForm<RoomSearchSchemaValue>({
    resolver: zodResolver(RoomSearchSchema),
    mode: "onChange",
    defaultValues: {
      name: undefined,
      location: undefined,
      fromDate: undefined,
      fromTime: undefined,
      toDate: undefined,
      toTime: undefined,
      amenities: [],
      minSeats: undefined,
      maxSeats: undefined,
    },
  });

  // Handle search form submission
  async function onSubmit(data: RoomSearchSchemaValue) {
    const params: Params = {};

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

    if (data.fromDate && data.fromTime) {
      const fromDateStr = data.fromDate.toLocaleDateString("en-CA");
      params.start_datetime = fromDateStr + "T" + data.fromTime + ":00";
    }

    if (data.toDate && data.toTime) {
      const toDateStr = data.toDate.toLocaleDateString("en-CA");
      params.end_datetime = toDateStr + "T" + data.toTime + ":00";
    }

    await fetchRooms("/rooms/", "/rooms/availability/", params, true);
    lastSearchParams.current = data;
  }

  // Reset search form and initial roomlist
  const onReset = async () => {
    form.reset();
    await fetchRooms("/rooms/", "/rooms/availability/");
    lastSearchParams.current = null;
  };

  const fetchRoomsRecursive = useCallback(
    async (
      url: string,
      availabilityUrl: string,
      params?: Params,
      accumulator: Room[] = [],
    ) => {
      const [roomsRes, availabilityRes] = await Promise.all([
        api.get(url, { params }),
        api.get(availabilityUrl, { params }),
      ]);

      const { data } = roomsRes;
      const { data: availabilityData } = availabilityRes;

      const newRooms = normaliseRooms(data.results, availabilityData.results);
      const updatedRooms = [...accumulator, ...newRooms];
      const visibleCount = newRooms.filter((room) => room.available).length;

      if (visibleCount === 0 && data.next && availabilityData.next) {
        return await fetchRoomsRecursive(
          data.next,
          availabilityData.next,
          params,
          updatedRooms,
        );
      }

      return {
        allRooms: updatedRooms,
        nextUrl: data.next,
        nextAvailabilityUrl: availabilityData.next,
      };
    },
    [],
  );

  // Fetch Rooms (Scroll down to get next page)
  const fetchRooms = useCallback(
    async (
      url: string,
      availabilityUrl: string,
      params?: Params,
      isSearch: boolean = false,
    ) => {
      setLoading(true);
      if (isSearch) setIsSubmitting(true);
      try {
        const isInitialPage =
          !url.includes("offset=") || url.includes("page=0");
        const { allRooms, nextUrl, nextAvailabilityUrl } =
          await fetchRoomsRecursive(url, availabilityUrl, params);
        setRooms((prev) => (isInitialPage ? allRooms : [...prev, ...allRooms]));
        setNextUrl(nextUrl);
        setNextAvailabilityUrl(nextAvailabilityUrl);
      } catch (error) {
        console.error("Failed to fetch rooms", error);
        // Reset to a safe empty state on error
        setRooms([]);
        setNextUrl(null);
        setNextAvailabilityUrl(null);
      } finally {
        setLoading(false);
        if (isSearch) setIsSubmitting(false);
      }
    },
    [fetchRoomsRecursive],
  );

  // initial load
  useEffect(() => {
    fetchRooms("/rooms/", "/rooms/availability/");
  }, []);

  // handle pagination
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver((observedItems) => {
      const marker = observedItems[0];
      if (marker.isIntersecting && nextUrl && nextAvailabilityUrl && !loading) {
        // if the marker is visible, nextUrl exists, and no fetch is in progress
        fetchRooms(nextUrl, nextAvailabilityUrl);
      }
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [nextUrl, loading, fetchRooms]);

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 p-4 md:grid-cols-2 md:gap-8 md:p-8 lg:grid-cols-5">
      <div className="col-span-1 lg:col-span-2">
        <h1 className="title mb-4">Book a Meeting Room</h1>
        <SearchRoomForm
          form={form}
          onSubmit={onSubmit}
          onReset={onReset}
          isSubmitting={isSubmitting}
          lastSearchParams={lastSearchParams.current}
        />
      </div>

      <div className="col-span-1 lg:col-span-3">
        <h2 className="title mb-4">Rooms Availability</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {rooms.filter((room) => room.available).length > 0
            ? rooms
                .filter((room) => room.available)
                .map((room) => (
                  <BookingRoomCard
                    key={room.id}
                    room={room}
                    onBook={() => router.push(`/calendar/${room.id}`)} // todo: to substitute with the correct route
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
