"use client";

import { useEffect, useState } from "react";
import { map } from "zod";

import Breadcrumb from "@/components/breadcrumb";
import InputField from "@/components/input";
import { AdminRoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { Room } from "@/types/card";

import FilterPopOver from "./filterbutton";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [roomNames, setRoomNames] = useState<string[]>([]);

  async function fetchRooms() {
    const apiUrl = "/rooms/";
    await api({ url: apiUrl, method: "get" })
      .then((response) => {
        const mappedRooms = mapRooms(response.data.results);

        setRooms(mappedRooms);
      })
      .catch((error) => {
        console.error("Error fetching rooms:", error);
      });
  }

  function searchfunction(value: string) {
    if (value === "") {
      fetchRooms();
      setSearchValue(value);
      return;
    }
    const filteredRooms = rooms.filter((room) =>
      room.title.toLowerCase().includes(value.toLowerCase()),
    );
    setRooms(filteredRooms);
    setSearchValue(value);
  }

  // Bandaid fix need to change component paramters to match api response
  function mapRooms(data: any[]) {
    return data.map((r: any) => ({
      title: r.name || "Untitled Room",
      image: r.img || "/rooms/default.jpg",
      location: r.location?.name || "Unknown",
      seats: r.capacity ?? 0,
      amenities: mapRoomNames(r.amenities) || [],
      available: r.is_active ?? false,
      bookings: 0,
      removed: false,
      id: r.id,
    }));
  }
  function mapRoomNames(data: any[]): string[] {
    return data.map((r: any) => r.name || "Untitled Room");
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  return (
    <div className="">
      <div className="bg-red-500"> Navbar here </div>
      <div className="mx-auto px-2 py-2">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Meeting Rooms" }]}
        />
      </div>
      {/* change this to style colour */}
      <div className="mx-auto my-auto min-h-screen bg-[#F9F9F9] px-10 py-5">
        <div className="subtitle m-2 mx-auto mb-5 flex h-full py-2">
          {" "}
          Meeting Room
          <div className="ml-auto flex items-center gap-2 whitespace-nowrap">
            <InputField
              className="w-[30rem]"
              kind="text"
              label=""
              name="search"
              value={searchValue}
              onChange={(e) => searchfunction(e)}
              placeholder="Search here"
            />

            <FilterPopOver roomlames={["holder", "holder"]} />
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
              onView={() => alert("View")} // push to room details page maybe like string + id
              onEdit={() => alert("Edit")}
              onRemove={() => alert("Remove")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
