import {
  AmenityResponse,
  RoomAvailabilityResponse,
  RoomResponse,
} from "@/lib/api-types";
import { getAvailabilityText } from "@/lib/rrule-utils";
import { Room } from "@/types/card";

// helper function to bridge the gap between api room data and props of BookingRoomCard
export function normaliseRooms(
  apiRooms: RoomResponse[],
  apiAvailabilities: RoomAvailabilityResponse[],
): Room[] {
  // turn list to map
  const availabilityMap = Object.fromEntries(
    apiAvailabilities.map((a: RoomAvailabilityResponse) => [
      a.room_id,
      a.availability,
    ]),
  );
  return apiRooms.map((apiRoom) => ({
    id: apiRoom.id,
    title: apiRoom.name,
    image: apiRoom.img,
    location: apiRoom.location.name,
    available: availabilityMap[apiRoom.id] ?? true,
  }));
}

// copied from issue 115
// helper function to bridge the gap between api room data and arguments of RoomCard
export function normaliseRoom(apiRoom: RoomResponse | undefined) {
  return {
    id: apiRoom?.id || 0,
    title: apiRoom?.name || "",
    image: apiRoom?.img || "",
    location: apiRoom?.location.name || "",
    available: true,
    availability: apiRoom
      ? getAvailabilityText(
          apiRoom.is_active,
          new Date(apiRoom.start_datetime),
          new Date(apiRoom.end_datetime),
          apiRoom.recurrence_rule,
        )
      : "",
  };
}
