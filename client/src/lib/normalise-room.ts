import {
  AmenityResponse,
  RoomAvailabilityResponse,
  RoomResponse,
} from "@/lib/api-types";
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
    seats: apiRoom.capacity,
    amenities:
      apiRoom.amenities?.map((amenity: AmenityResponse) => amenity.name) ?? [],
    available: availabilityMap[apiRoom.id] ?? true,
  }));
}
