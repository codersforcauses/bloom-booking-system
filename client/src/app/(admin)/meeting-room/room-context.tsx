import { createContext } from "react";

import { AmenityResponse, LocationResponse } from "@/lib/api-types";
import { Room } from "@/types/card";

interface RoomContextType {
  roomNames: string[];
  locations: LocationResponse[];
  amenities: AmenityResponse[];
  onFilterChange: (filters: Partial<Room>) => void;
  filterValues: Partial<Room>;
}

const RoomContext = createContext<RoomContextType | null>(null);

export default RoomContext;
