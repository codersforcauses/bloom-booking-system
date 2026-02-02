import { createContext } from "react";

import { AmenityResponse, LocationResponse } from "@/lib/api-types";
import { Room } from "@/types/card";

import { RoomFilterSchemaValue } from "./filter-dropdown";

interface RoomContextType {
  roomNames: string[];
  locations: LocationResponse[];
  amenities: AmenityResponse[];
  onFilterChange: (filters: RoomFilterSchemaValue) => void;
  filterValues: RoomFilterSchemaValue;
}

const RoomContext = createContext<RoomContextType | null>(null);

export default RoomContext;
