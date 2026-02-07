import { createContext } from "react";

import { AmenityResponse, LocationResponse } from "@/lib/api-types";

import type { RoomFilterSchemaValue } from "./filter-dropdown";

interface RoomContextType {
  roomNames: string[];
  locations: LocationResponse[];
  isLocationsLoading: boolean;
  amenities: AmenityResponse[];
  isAmenitiesLoading: boolean;
  onFilterChange: (filters: RoomFilterSchemaValue) => void;
  filterValues: RoomFilterSchemaValue;
}

const RoomContext = createContext<RoomContextType | null>(null);

export default RoomContext;
