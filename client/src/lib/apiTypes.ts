// client/src/lib/apiTypes.ts

export type ISODateTimeString = string;

// ---------- Auth ----------
export type LoginResponse = {
  access: string;
  refresh: string;
};

export type RefreshResponse = {
  access: string;
};

// ---------- Shared ----------
export type Location = {
  id: number;
  name: string;
};

export type Amenity = {
  id: number;
  name: string;
};

// ---------- Rooms ----------
export type Room = {
  id: number;
  name: string;
  img: string;
  location: Location;
  capacity: number;
  amenities: Amenity[];
  start_datetime: ISODateTimeString;
  end_datetime: ISODateTimeString;
  recurrence_rule: string;
  is_active: boolean;
};

export type RoomCreateRequest = {
  name: string;
  img: File | Blob;
  location_id: number;
  capacity: number;
  amenities_id: number[];
  start_datetime: ISODateTimeString;
  end_datetime: ISODateTimeString;
  recurrence_rule: string;
  is_active: boolean;
};

export type RoomUpdateRequest = Partial<RoomCreateRequest>;

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type RoomListResponse = PaginatedResponse<Room>;

export type PingResponse = string;
