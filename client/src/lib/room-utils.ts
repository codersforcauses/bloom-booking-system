import { RoomResponse } from "@/lib/api-types";

import api from "./api";

// helper function to bridge the gap between api room data and arguments of RoomCard
export function normalizeRoom(apiRoom: RoomResponse | undefined) {
  if (apiRoom) {
    const isActive = apiRoom.is_active;
    const start = new Date(apiRoom.start_datetime);
    const end = new Date(apiRoom.end_datetime);
    const rrule = apiRoom.recurrence_rule;
  }
  return {
    id: apiRoom?.id || 0,
    title: apiRoom?.name || "",
    image: apiRoom?.img || "",
    location: apiRoom?.location.name,
    seats: apiRoom?.capacity,
    amenities:
      apiRoom?.amenities?.map(
        (amenity: Record<string, unknown>) => amenity.name as string,
      ) ?? [],
    available: true,
  };
}
