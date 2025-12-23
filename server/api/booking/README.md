# Booking API Documentation

## Introduction

Backend API for creating bookings, listing and filtering bookings for admin, retrieving bookings for users, updating bookings and canceling bookings with Google Calendar integration.

## Endpoints

### 1. POST /api/bookings/

- **Purpose**: Create a new booking for a room with Google Calendar integration.
- **Access**: Everyone
- **Request Body**:
  ```json
  {
    "room_id": 1,
    "visitor_name": "Alice Johnson",
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-11-03T10:00:00Z",
    "end_datetime": "2025-11-03T11:00:00Z",
    "recurrence_rule": ""
  }
  ```
- **Success Response** (201 Created):
  ```json
  {
    "id": 1,
    "room": { "id": 10, "name": "Meeting Room A" },
    "visitor_name": "Alice Johnson",
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-11-03T10:00:00Z",
    "end_datetime": "2025-11-03T11:00:00Z",
    "recurrence_rule": "",
    "status": "CONFIRMED",
    "google_event_id": "abc123xyz",
    "created_at": "2025-10-31T06:10:00Z"
  }
  ```
- **Error Response** (500 Internal Server Error):
  ```json
  {
    "detail": "Failed to create Google Calendar event. Error: [error details]"
  }
  ```

### 2. GET /api/bookings/

- **Purpose**: Get all bookings for admin with optional filtering.
- **Access**: Admin (authenticated users)
- **Query Parameters**:
  - `room_id` (number): Filter by room ID
  - `date` (YYYY-MM-DD): Filter by booking date
  - `visitor_name` (string): Case-insensitive partial match
  - `visitor_email` (string): Case-insensitive exact match
- **Example**: `?room_id=1&date=2025-11-03&visitor_name=alice&visitor_email=alice@example.com`
- **Success Response** (200 OK):
  ```json
  {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "room": { "id": 10, "name": "Meeting Room A" },
        "visitor_name": "Alice Johnson",
        "visitor_email": "alice@example.com",
        "start_datetime": "2025-11-03T10:00:00Z",
        "end_datetime": "2025-11-03T11:00:00Z",
        "recurrence_rule": "",
        "status": "CONFIRMED",
        "google_event_id": "abc123xyz",
        "created_at": "2025-10-31T06:10:00Z"
      }
    ]
  }
  ```

### 3. GET /api/bookings/ (with visitor_email)

- **Purpose**: Get all bookings for a specific visitor.
- **Access**: Everyone (when `visitor_email` query parameter is provided)
- **Query Parameters**:
  - `visitor_email` (required): Case-insensitive exact match
- **Example**: `?visitor_email=alice@example.com`
- **Success Response**: Same format as admin endpoint above

### 4. GET /api/bookings/{id}/ (Admin)

- **Purpose**: Retrieve a specific booking by ID for admin.
- **Access**: Admin (authenticated users)
- **URL**: `/api/bookings/1/`
- **Success Response** (200 OK):
  ```json
  {
    "id": 1,
    "room": { "id": 10, "name": "Meeting Room A" },
    "visitor_name": "Alice Johnson",
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-11-03T10:00:00Z",
    "end_datetime": "2025-11-03T11:00:00Z",
    "recurrence_rule": "",
    "status": "CONFIRMED",
    "google_event_id": "abc123xyz",
    "created_at": "2025-10-31T06:10:00Z"
  }
  ```

### 5. GET /api/bookings/{id}/ (Visitor)

- **Purpose**: Retrieve a specific booking by ID and visitor email.
- **Access**: Everyone (with visitor_email verification)
- **Query Parameters**:
  - `visitor_email` (required): Must match the booking's visitor email
- **URL**: `/api/bookings/1/?visitor_email=alice@example.com`
- **Success Response** (200 OK): Same format as admin endpoint
- **Error Response** (404 Not Found): When ID and visitor_email don't match

### 6. PATCH /api/bookings/{id}/ (Update)

- **Purpose**: Update (reschedule) a booking with Google Calendar sync.
- **Access**: Everyone (visitor_email verification required)
- **Request Body**:
  ```json
  {
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-11-03T12:00:00Z",
    "end_datetime": "2025-11-03T13:00:00Z",
    "recurrence_rule": ""
  }
  ```
- **Success Response** (200 OK):
  ```json
  {
    "id": 1,
    "status": "CONFIRMED",
    "updated_at": "2025-10-31T06:20:00Z"
  }
  ```
- **Error Response** (400 Bad Request):
  ```json
  {
    "detail": "Visitor email is required."
  }
  ```

### 7. PATCH /api/bookings/{id}/ (Cancel)

- **Purpose**: Cancel a booking and delete from Google Calendar.
- **Access**: Everyone (visitor_email verification required)
- **Request Body**:
  ```json
  {
    "visitor_email": "alice@example.com",
    "cancel_reason": "Meeting postponed"
  }
  ```
- **Success Response** (200 OK):
  ```json
  {
    "id": 1,
    "status": "CANCELLED",
    "cancel_reason": "Meeting postponed",
    "updated_at": "2025-10-31T06:25:00Z"
  }
  ```
- **Error Responses**:
  - **400 Bad Request**: `{"detail": "Visitor email is incorrect."}`
  - **404 Not Found**: When booking doesn't exist or visitor_email doesn't match

## Important Notes

### HTTP Methods

- **Supported**: `GET`, `POST`, `PATCH`
- **Not Supported**: `PUT`, `DELETE` (returns 405 Method Not Allowed)

### Google Calendar Integration

- **Create**: Automatically creates Google Calendar event and stores `google_event_id`
- **Update**: Syncs changes to Google Calendar event
- **Cancel**: Deletes Google Calendar event and clears `google_event_id`

### Security

- **Admin Access**: Requires authentication for unfiltered listing and retrieval
- **Visitor Access**: Requires `visitor_email` parameter for access control
- **Update/Cancel**: Validates `visitor_email` matches booking owner
- **Privacy**: Returns 404 instead of 403 to prevent information disclosure

### Error Handling

- **Validation Errors**: Return 400 Bad Request with field-specific errors
- **Google Calendar Errors**: Return 500 Internal Server Error with error details
- **Authentication Errors**: Return 401 Unauthorized
- **Permission Errors**: Return 404 Not Found (for privacy)

### Data Validation

- `end_datetime` must be greater than `start_datetime`
- `cancel_reason` is required when status is "CANCELLED"
- Email format validation on `visitor_email`
