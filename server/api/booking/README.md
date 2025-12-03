# Booking API Documentation

## Introduction
Backend API for create a booking, list and filter bookings for admin, list one's bookings for users, update a booking and cancel a booking. 

## Endpoints
1. POST /api/bookings
- Purpose: Create a new booking for a room.
- Access：Everyone
- Sample Request Body (with google_event_id to be removed after google calendar integration):
{
    "room_id": 1,
    "visitor_name": "Alice Johnson",
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-11-03T10:00:00Z",
    "end_datetime": "2025-11-03T11:00:00Z",
    "recurrence_rule": "",
    "status": "CONFIRMED",
    "google_event_id": "abc123",
}
- Sample Response:
{
    "id": 1,
    "room": { "id": 10, "name": "Meeting Room A" },
    "visitor_name": "Alice Johnson",
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-11-03T10:00:00Z",
    "end_datetime": "2025-11-03T11:00:00Z",
    "recurrence_rule": "",
    "status": "CONFIRMED",
    "google_event_id": "abc123",
    "created_at": "2025-10-31T06:10:00Z"
}

2. GET /api/bookings
- Purpose: Get all bookings for admin. Allow admins to optionally filter by visitor name, email, room name or date.
- Access：Admin
- Query Params: room_id, date, visitor_name (case insensitive, allow partial qurey), visitor_email (case insensitive). Example: ?room_id=1&date=2025-11-03&visitor_name=alice&visitor_email=alice@example.com
- Sample Response:
[
  {
    "id": 1,
    "room": { "id": 10, "name": "Meeting Room A" },
    "visitor_name": "Alice Johnson",
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-11-03T10:00:00Z",
    "end_datetime": "2025-11-03T11:00:00Z",
    "recurrence_rule": "",
    "status": "CONFIRMED",
    "google_event_id": "abc123",
    "created_at": "2025-10-31T06:10:00Z"
  }
]

3. GET /api/bookings/{id} - for admin
- Purpose: retrive the detail of a booking for admin by id. 
- Access: Admin
- Sample Response:
url: /api/bookings/1
[
  {
    "id": 1,
    "room": { "id": 10, "name": "Meeting Room A" },
    "visitor_name": "Alice Johnson",
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-11-03T10:00:00Z",
    "end_datetime": "2025-11-03T11:00:00Z",
    "recurrence_rule": "",
    "status": "CONFIRMED",
    "google_event_id": "abc123",
    "created_at": "2025-10-31T06:10:00Z"
  }
]

4. GET /api/bookings/bookings/{id} - for everyone
- Purpose: retrive the detail of a booking by id and visitor_email. When the id and visitor_email do not match to a single object, return 404 Not Found Error. 
- Access：Everyone
- Query Params: visitor_email. Example:?visitor_email=alice@example.com
- Sample Response:
url: /api/bookings/1?visitor_email=alice@example.com
[
  {
    "id": 1,
    "room": { "id": 10, "name": "Meeting Room A" },
    "visitor_name": "Alice Johnson",
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-11-03T10:00:00Z",
    "end_datetime": "2025-11-03T11:00:00Z",
    "recurrence_rule": "",
    "status": "CONFIRMED",
    "google_event_id": "abc123",
    "created_at": "2025-10-31T06:10:00Z"
  }
]

5. PUT /api/bookings/{id}
- Purpose: Update (reschedule) a booking
- Access：Everyone
- Sample Request Body:
{
  "start_datetime": "2025-11-03T12:00:00Z",
  "end_datetime": "2025-11-03T13:00:00Z"
  "recurrence_rule": "",
}
- Sample Response:
{
  "id": 1,
  "status": "CONFIRMED",
  "updated_at": "2025-10-31T06:20:00Z"
}

6. DELETE /api/bookings/{id}
- Purpose: Cancel a booking
- Access：Everyone
- Sample Request Body (when no visitor_email or visitor_email is unmatched, users get 400 Bad Request):
{
  "visitor_email": "alice@example.com",
  "cancel_reason": "Meeting postponed"
}
- Sample Response:
{
  "id": 55,
  "status": "CANCELLED",
  "cancel_reason": "Meeting postponed",
  "updated_at": "2025-10-31T06:25:00Z"
}

7. GET /api/bookings/search
- Purpose: search bookings for visitors. Visitor: can only get result by filtering by email (to find bookings).
- Access：Everyone
- Query Params: visitor_email. Example:?visitor_email=alice@example.com
- Sample Response:
[
  {
    "id": 1,
    "room": { "id": 10, "name": "Meeting Room A" },
    "visitor_name": "Alice Johnson",
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-11-03T10:00:00Z",
    "end_datetime": "2025-11-03T11:00:00Z",
    "recurrence_rule": "",
    "status": "CONFIRMED",
    "google_event_id": "abc123",
    "created_at": "2025-10-31T06:10:00Z"
  }
]

## Todo:
- Integrate Google calendar API module into booking creation process to generate a google event id (which can be updated in serializers.BookingSerializer.create)