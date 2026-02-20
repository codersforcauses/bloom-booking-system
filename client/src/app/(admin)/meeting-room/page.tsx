"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AdminRoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RoomAPI, { useFetchRooms } from "@/hooks/room";
import { AmenityResponse, LocationResponse } from "@/lib/api-types";
import { Room } from "@/types/card";

import FilterPopOver from "./filter-button";
import type { RoomFilterSchemaValue } from "./filter-dropdown";
import { normalizeRoom } from "./normalize-room";
import RoomContext from "./room-context";
import StatusDialog from "./status-dialog";

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pendingSearch, setPendingSearch] = useState<string>("");
  const [filters, setFilters] = useState<RoomFilterSchemaValue>({});
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Build customParams object for API
  function buildCustomParams() {
    const customParams: Record<string, string> = {};
    if (filters.locations && filters.locations.length)
      customParams.locations = filters.locations.join(",");
    if (filters.amenities && filters.amenities.length)
      customParams.amenities = filters.amenities.join(",");
    if (filters.minSeats)
      customParams.min_capacity = filters.minSeats.toString();
    if (filters.maxSeats)
      customParams.max_capacity = filters.maxSeats.toString();
    if (filters.isActive !== undefined)
      customParams.is_active = filters.isActive.toString();
    return customParams;
  }

  // Custom fetch hook with dynamic params
  const {
    data: rooms,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useFetchRooms({
    search: searchTerm,
    ...buildCustomParams(),
  });

  // Suppose the number of locations and amenities are small enough to fetch all at once
  const { data: locations, isLoading: isLocationsLoading } =
    RoomAPI.useFetchRoomLocations({
      page: 1,
      nrows: 100,
    });
  const { data: amenities, isLoading: isAmenitiesLoading } =
    RoomAPI.useFetchRoomAmenities({
      page: 1,
      nrows: 100,
    });

  // Always normalize rooms for rendering
  const normalizedRooms = useMemo(
    () => rooms?.map(normalizeRoom) ?? [],
    [rooms],
  );

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPendingSearch(e.target.value);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setSearchTerm(pendingSearch);
    }
  }

  function handleFilterChange(newFilters: RoomFilterSchemaValue) {
    setFilters(newFilters);
  }

  const roomNames = useMemo(
    () => normalizedRooms.map((r) => r.title),
    [normalizedRooms],
  );

  // Infinite scroll effect
  useEffect(() => {
    if (!loadMoreRef.current || isFetchingNextPage) return;
    const observer = new IntersectionObserver((observedItems) => {
      const marker = observedItems[0];
      if (marker.isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <RoomContext.Provider
      value={{
        roomNames,
        locations: (locations as LocationResponse[]) || [],
        isLocationsLoading,
        amenities: (amenities as AmenityResponse[]) || [],
        isAmenitiesLoading,
        onFilterChange: handleFilterChange,
        filterValues: filters,
      }}
    >
      <div className="mx-auto my-auto min-h-screen px-10 py-5">
        <div className="mb-3 flex w-full flex-col items-center justify-between md:flex-row">
          <div className="subtitle mb-2 h-full py-2">Meeting Room</div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Input
              className="min-w-24 max-w-64"
              type="text"
              name="search"
              value={pendingSearch}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search room name"
            />

            <FilterPopOver />

            <Link href="/meeting-room/add" passHref>
              <Button variant="confirm">Add Room</Button>
            </Link>
          </div>
        </div>

        {isError && (
          <div className="mb-4 text-bloom-red">
            {error instanceof Error
              ? error.message
              : "Failed to load rooms. Please try again."}
          </div>
        )}

        {/* To do: Show loading state */}

        {normalizedRooms.length === 0 && !isLoading && !isError && (
          <div className="mb-4">No rooms found. Please try again.</div>
        )}

        <div className="grid min-w-80 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {normalizedRooms.map((room) => (
            <AdminRoomCard
              key={room.id}
              room={room}
              onView={() => {
                router.push(`/calendar/${room.id}`);
              }}
              onEdit={() => {
                router.push(`/meeting-room/edit/${room.id}`);
              }}
              onStatusChange={() => {
                setSelectedRoom(room);
                setStatusDialogOpen(true);
              }}
            />
          ))}
          {/* an invisible marker that trigger fetch when scrolling into view */}
          <div ref={loadMoreRef} style={{ height: 1 }} />
        </div>
      </div>
      {selectedRoom && (
        <StatusDialog
          room={{ id: selectedRoom.id, name: selectedRoom.title }}
          action={selectedRoom.available ? "setInactive" : "setActive"}
          isOpen={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
        />
      )}
    </RoomContext.Provider>
  );
}
