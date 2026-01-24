"use client";

import { useContext, useEffect, useMemo, useState } from "react";

import Breadcrumb from "@/components/breadcrumb";
import InputField from "@/components/input";
import { AdminRoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { Room } from "@/types/card";

import FilterPopOver from "./filterbutton";
import RoomContext from "./roomContext";

type ApiListResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type ApiRoom = {
  id: number;
  name: string;
  img: string | null;
  location: { id: number; name: string } | null;
  capacity: number | null;
  amenities: { id: number; name: string }[];
  is_active: boolean;
  start_datetime?: string;
  end_datetime?: string;
  recurrence_rule?: string | null;
};

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
      <rect width="100%" height="100%" fill="#f2f2f2"/>
      <rect x="60" y="70" width="680" height="360" rx="18" fill="#e6e6e6"/>
      <text x="50%" y="52%" text-anchor="middle" font-family="Arial" font-size="36" fill="#9a9a9a">
        Room
      </text>
    </svg>
  `);

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const roomContext = useContext(RoomContext);

  function mapRoomNames(data: any[]): string[] {
    return (data ?? []).map((r: any) => r?.name || "Untitled Room");
  }

  function mapRooms(data: ApiRoom[]): Room[] {
    return (data ?? []).map((r) => {
      const isActive = r?.is_active ?? false;

      // bandaid string until backend provides real "open hours" etc.
      const availabilityStr = isActive ? "Active" : "Inactive";

      return {
        id: r.id,
        title: r.name || "Untitled Room",
        image: r.img || FALLBACK_IMG,
        location: r.location?.name || "Unknown",
        seats: r.capacity ?? 0,
        amenities: mapRoomNames(r.amenities ?? []),
        bookings: 0,
        removed: false,

        available: isActive,
        availablility: availabilityStr,
      };
    });
  }

  async function fetchRooms() {
    try {
      const response = await api.get("/rooms/");
      const payload = response.data as ApiListResponse<ApiRoom>;
      const mapped = mapRooms(payload?.results ?? []);
      setAllRooms(mapped);
      setRooms(mapped);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setAllRooms([]);
      setRooms([]);
    }
  }

  function handleSearchChange(input: any) {
    const value =
      typeof input === "string" ? input : (input?.target?.value ?? "");

    setSearchValue(value);

    if (!value) {
      setRooms(allRooms);
      return;
    }

    const v = value.toLowerCase();
    setRooms(allRooms.filter((room) => room.title.toLowerCase().includes(v)));
  }

  const roomNames = useMemo(() => allRooms.map((r) => r.title), [allRooms]);

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <RoomContext.Provider value={{ roomNames, setRooms }}>
      <div className="">
        <div className="bg-red-500"> Navbar here </div>

        <div className="mx-auto px-2 py-2">
          <Breadcrumb
            items={[{ label: "Home", href: "/" }, { label: "Meeting Rooms" }]}
          />
        </div>

        <div className="mx-auto my-auto min-h-screen bg-[#F9F9F9] px-10 py-5">
          <div className="subtitle m-2 mx-auto mb-5 flex h-full py-2">
            Meeting Room
            <div className="ml-auto flex items-center gap-2 whitespace-nowrap">
              <InputField
                className="w-[30rem]"
                kind="text"
                label=""
                name="search"
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Search here"
              />

              <FilterPopOver roomNames={roomNames} />

              <a href="/meeting-room/add">
                <Button variant="confirm">Add Room</Button>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {rooms.map((room) => (
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
      </div>
    </RoomContext.Provider>
  );
}
