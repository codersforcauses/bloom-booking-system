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

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const roomContext = useContext(RoomContext);

  async function fetchRooms() {
    try {
      const response = await api.get("/rooms/");
      const payload = response.data.results;
      console.log("Fetched rooms:", payload);
      setAllRooms(payload);
      setRooms(payload);
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
    setRooms(allRooms.filter((room) => room.name.toLowerCase().includes(v)));
  }

  const roomNames = useMemo(() => allRooms.map((r) => r.name), [allRooms]);

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
