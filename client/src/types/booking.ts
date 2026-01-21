export type BookingRoom = {
  id: number;
  name: string;
};

export type BookingStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type Booking = {
  id: number;
  room: BookingRoom;

  visitor_name: string;
  visitor_email: string;

  start_datetime: string; // ISO 8601
  end_datetime: string; // ISO 8601

  recurrence_rule: string | null;

  status: BookingStatus;

  google_event_id: string | null;

  created_at: string; // ISO 8601
};
