// client/src/lib/api-types.ts

// ---------- Auth ----------
export type LoginResponse = {
  access: string;
  refresh: string;
};

export type RefreshResponse = {
  access: string;
};

// ---------- Shared ----------
export type LocationResponse = {
  id: number;
  name: string;
};

export type AmenityResponse = {
  id: number;
  name: string;
};

// ---------- Rooms ----------
export type RoomResponse = {
  id: number;
  name: string;
  img: string;
  location: LocationResponse;
  capacity: number;
  amenities: AmenityResponse[];
  start_datetime: string;
  end_datetime: string;
  recurrence_rule: string;
  is_active: boolean;
};

export type RoomShortResponse = {
  id: number;
  name: string;
};

type RoomStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type UpdateBookingRequest = Partial<{
  room_id: number;
  visitor_name: string;
  visitor_email: string;
  start_datetime: string;
  end_datetime: string;
  recurrence_rule: string;
  cancel_reason: string;
}>;

export type BookingResponse = {
  id: number;
  room: RoomShortResponse;
  visitor_name: string;
  visitor_email: string;
  start_datetime: string;
  end_datetime: string;
  recurrence_rule: string;
  status: RoomStatus;
  google_event_id: string;
  created_at: string;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PaginatedRoomResponse = PaginatedResponse<RoomResponse>;
export type PaginatedLocationResponse = PaginatedResponse<LocationResponse>;
export type PaginatedAmenityResponse = PaginatedResponse<AmenityResponse>;
export type PaginatedBookingResponse = PaginatedResponse<BookingResponse>;

export type PingResponse = string;

export type RoomAvailabilityResponse = {
  room_id: number;
  availability: boolean;
};

// for /rooms/availability/ endpoint
export type PaginatedRoomAvailabilityResponse =
  PaginatedResponse<RoomAvailabilityResponse>;
