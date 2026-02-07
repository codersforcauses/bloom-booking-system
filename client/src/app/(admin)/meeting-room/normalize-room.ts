// Normalize API RoomResponse to Room type
import { RoomResponse } from "@/lib/api-types";
import { Room } from "@/types/card";

export function normalizeRoom(apiRoom: RoomResponse): Room {
  return {
    id: apiRoom.id,
    title: apiRoom.name,
    image: apiRoom.img,
    location: apiRoom.location.name,
    available: apiRoom.is_active,
    seats: apiRoom.capacity,
    amenities: apiRoom.amenities?.map((a) => a.name) ?? [],
    // Optionally add more fields if needed
  };
}
