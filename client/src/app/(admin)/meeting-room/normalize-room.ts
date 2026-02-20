// Normalize API RoomResponse to Room type
import { RoomResponse } from "@/lib/api-types";
import { getAvailabilityText } from "@/lib/rrule-utils";
import { Room } from "@/types/card";

export function normalizeRoom(apiRoom: RoomResponse): Room {
  return {
    id: apiRoom.id,
    title: apiRoom.name,
    image: apiRoom.img,
    location: apiRoom.location.name,
    available: apiRoom.is_active,
    isActive: apiRoom.is_active,
    seats: apiRoom.capacity,
    amenities: apiRoom.amenities?.map((a) => a.name) ?? [],
    availability: apiRoom
      ? getAvailabilityText(
          apiRoom.is_active,
          new Date(apiRoom.start_datetime),
          new Date(apiRoom.end_datetime),
          apiRoom.recurrence_rule,
        )
      : "",
    // Optionally add more fields if needed
  };
}
