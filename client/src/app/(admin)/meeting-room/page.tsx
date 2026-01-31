"use client";

import { useEffect,useMemo, useState } from "react";

import { AdminRoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RoomAPI, { useFetchRooms } from "@/hooks/room";
import {
  AmenityResponse,
  LocationResponse,
  RoomResponse,
} from "@/lib/api-types";
import { Room } from "@/types/card";

import FilterPopOver from "./filter-button";
import { normalizeRoom } from "./normalize-room";
import RoomContext from "./room-context";

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pendingSearch, setPendingSearch] = useState<string>("");
  const [filters, setFilters] = useState<Partial<Room>>({});

  // Build customParams object for API
  function buildCustomParams() {
    const customParams: Record<string, string> = {};
    if (filters.location) customParams.location = filters.location;
    // if (filters.seats) customParams.min_capacity = filters.seats;
    if (filters.amenities && filters.amenities.length)
      customParams.amenities = filters.amenities.join(",");
    // if (filters.available !== undefined && filters.available !== "")
    //   customParams.available = filters.available;
    return customParams;
  }

  // Custom fetch hook with dynamic params
  const {
    data: rooms,
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchRooms({
    page: 1,
    nrows: 100,
    search: searchTerm,
    ...buildCustomParams(),
  });

  const { data: locations } = RoomAPI.useFetchRoomLocations({
    page: 1,
    nrows: 100,
  });
  const { data: amenities } = RoomAPI.useFetchRoomAmenities({
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

  function handleFilterChange(newFilters: Partial<Room>) {
    setFilters(newFilters);
  }

  const roomNames = useMemo(
    () => normalizedRooms.map((r) => r.title),
    [normalizedRooms],
  );

  return (
    <RoomContext.Provider
      value={{
        roomNames,
        locations: (locations as LocationResponse[]) || [],
        amenities: (amenities as AmenityResponse[]) || [],
        onFilterChange: handleFilterChange,
        filterValues: filters,
      }}
    >
      <div className="mx-auto my-auto min-h-screen px-10 py-5">
        <div className="subtitle mx-auto mb-2 h-full py-2">Meeting Room</div>
        <div className="ml-auto flex items-center justify-center gap-2 whitespace-nowrap sm:justify-end">
          <Input
            className="min-w-24 max-w-64"
            type="text"
            name="search"
            value={pendingSearch}
            onChange={handleSearchInputChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search here"
          />

          <FilterPopOver />

          <a href="/meeting-room/add">
            <Button variant="confirm">Add Room</Button>
          </a>
        </div>

        {isError && (
          <div className="mb-4 rounded bg-red-100 px-4 py-2 text-red-700">
            {error instanceof Error
              ? error.message
              : "Failed to load rooms. Please try again."}
          </div>
        )}
        {isLoading && (
          <div className="mb-4 rounded bg-yellow-100 px-4 py-2 text-yellow-700">
            Loading rooms…
          </div>
        )}

        <div className="grid min-w-80 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {normalizedRooms.map((room) => (
            <AdminRoomCard
              key={room.id}
              room={room}
              onView={() => alert("View")}
              onEdit={() => alert("Edit")}
              onRemove={() => alert("Remove")}
            />
          ))}
        </div>
      </div>
    </RoomContext.Provider>
  );
}
