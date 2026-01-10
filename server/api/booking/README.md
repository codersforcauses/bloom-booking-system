# Booking API Documentation

## Introduction

Backend API for creating bookings, listing and filtering bookings for admin, retrieving bookings for users, updating bookings and canceling bookings with Google Calendar integration. The system includes comprehensive validation, rollback functionality, and timezone-aware operations for Australia/Perth timezone.

## Key Features

- **Google Calendar Integration**: Automatic sync with Google Calendar for all booking operations
- **Transaction Rollback**: Database rollback if Google Calendar operations fail
- **Overlap Prevention**: Prevents double bookings for the same room
- **Timezone Aware**: All datetimes handled in Australia/Perth timezone
- **Same-Day Validation**: Bookings must start and end on the same day
- **Future Booking Only**: New bookings can only be created for future times
- **Auto-Cancellation**: Setting `cancel_reason` automatically cancels booking
- **Read-Only Status**: Status field is managed automatically by the system

## Endpoints

### 1. POST /api/bookings/

- **Purpose**: Create a new booking for a room with Google Calendar integration and transaction rollback.
- **Access**: Everyone
- **Request Body**:
  ```json
  {
    "room_id": 1,
    "visitor_name": "Alice Johnson",
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-12-25T10:00:00+08:00",
    "end_datetime": "2025-12-25T11:00:00+08:00",
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
    "start_datetime": "2025-12-25T10:00:00.000000+08:00",
    "end_datetime": "2025-12-25T11:00:00.000000+08:00",
    "recurrence_rule": "",
    "status": "CONFIRMED",
    "google_event_id": "abc123xyz",
    "created_at": "2025-12-24T14:10:00.000000+08:00"
  }
  ```
- **Error Responses**:
  - **400 Bad Request** - Validation errors:
    ```json
    {
      "start_datetime": ["Booking start time must be in the future."]
    }
    ```
    ```json
    {
      "end_datetime": ["End datetime must be greater than start datetime."]
    }
    ```
    ```json
    {
      "non_field_errors": [
        "Booking start and end times must be on the same day (Australia/Perth time). Start date: 2025-12-25, End date: 2025-12-26"
      ]
    }
    ```
    ```json
    {
      "non_field_errors": [
        "Room is already booked from 2025-12-25 09:00 to 2025-12-25 12:00 by John Doe."
      ]
    }
    ```
  - **400 Bad Request** - Google Calendar failure with rollback:
    ```json
    {
      "detail": [
        "Failed to create Google Calendar event. Booking creation cancelled. Error: [error details]"
      ]
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
- **Example**: `?room_id=1&date=2025-12-25&visitor_name=alice&visitor_email=alice@example.com`
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
        "start_datetime": "2025-12-25T10:00:00.000000+08:00",
        "end_datetime": "2025-12-25T11:00:00.000000+08:00",
        "recurrence_rule": "",
        "status": "CONFIRMED",
        "google_event_id": "abc123xyz",
        "created_at": "2025-12-24T14:10:00.000000+08:00"
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
    "start_datetime": "2025-12-25T10:00:00.000000+08:00",
    "end_datetime": "2025-12-25T11:00:00.000000+08:00",
    "recurrence_rule": "",
    "status": "CONFIRMED",
    "google_event_id": "abc123xyz",
    "created_at": "2025-12-24T14:10:00.000000+08:00"
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

- **Purpose**: Update (reschedule) a booking with Google Calendar sync and transaction rollback.
- **Access**: Everyone (visitor_email verification required)
- **Request Body**:
  ```json
  {
    "visitor_email": "alice@example.com",
    "start_datetime": "2025-12-25T12:00:00+08:00",
    "end_datetime": "2025-12-25T13:00:00+08:00",
    "recurrence_rule": ""
  }
  ```
- **Success Response** (200 OK):
  ```json
  {
    "id": 1,
    "status": "CONFIRMED",
    "updated_at": "2025-12-24T14:20:00.000000+08:00"
  }
  ```
- **Error Responses**:
  - **400 Bad Request**:
    ```json
    {
      "detail": "Visitor email is required."
    }
    ```
    ```json
    {
      "detail": "Visitor email is incorrect."
    }
    ```
    ```json
    {
      "detail": "Failed to sync with Google Calendar. Booking update cancelled. Error: [error details]"
    }
    ```

### 7. PATCH /api/bookings/{id}/ (Cancel)

- **Purpose**: Cancel a booking and delete from Google Calendar with transaction rollback.
- **Access**: Everyone (visitor_email verification required)
- **Request Body**:
  ```json
  {
    "visitor_email": "alice@example.com",
    "cancel_reason": "Meeting postponed due to weather"
  }
  ```
- **Success Response** (200 OK):
  ```json
  {
    "id": 1,
    "status": "CANCELLED",
    "cancel_reason": "Meeting postponed due to weather",
    "updated_at": "2025-12-24T14:25:00.000000+08:00"
  }
  ```
- **Error Responses**:
  - **400 Bad Request**:
    ```json
    {
      "detail": "Visitor email is incorrect."
    }
    ```
    ```json
    {
      "detail": "Failed to delete Google Calendar event. Cancellation rolled back. Error: [error details]"
    }
    ```
  - **404 Not Found**: When booking doesn't exist

## Important Notes

### HTTP Methods

- **Supported**: `GET`, `POST`, `PATCH`
- **Not Supported**: `PUT`, `DELETE` (returns 405 Method Not Allowed)

### Google Calendar Integration & Transaction Rollback

- **Create**: Automatically creates Google Calendar event and stores `google_event_id`
  - If Google Calendar creation fails, the entire booking is rolled back (not saved to database)
- **Update**: Syncs changes to Google Calendar event
  - If Google Calendar update fails, database changes are rolled back
- **Cancel**: Deletes Google Calendar event and clears `google_event_id`
  - If Google Calendar deletion fails, cancellation is rolled back

### Timezone Handling

- **Input**: Accepts any timezone format (UTC, Perth time with +08:00, etc.)
- **Output**: All datetime responses are in Australia/Perth timezone (+08:00)
- **Validation**: Same-day validation uses Perth timezone for accurate date comparison
- **Example**: `"start_datetime": "2025-12-25T18:34:14.607000+08:00"` (Perth time)

### Data Validation Rules

#### Time Validations:

- `start_datetime` must be in the future (for new bookings)
- `end_datetime` must be greater than `start_datetime`
- Booking start and end times must be on the same day (Australia/Perth timezone)

#### Room Availability:

- No overlapping bookings for the same room
- Only considers `CONFIRMED` and `COMPLETED` bookings as conflicts
- `CANCELLED` bookings do not block room availability
- Provides detailed error messages showing conflicting booking details

#### Status Management:

- `status` field is **read-only** - cannot be set manually by clients
- Automatically set to `CANCELLED` when `cancel_reason` is provided
- Default status is `CONFIRMED` for new bookings
- Attempting to set `status` manually returns 400 error with helpful message

#### Cancellation Logic:

- Providing `cancel_reason` automatically cancels the booking
- `cancel_reason` must not be empty when cancelling
- Cancelled bookings are removed from Google Calendar
- `google_event_id` is cleared after successful cancellation

### Security & Access Control

- **Admin Access**: Requires JWT authentication for unfiltered listing and retrieval
- **Visitor Access**: Requires `visitor_email` parameter for access control
- **Update/Cancel**: Validates `visitor_email` matches booking owner
- **Privacy**: Returns 404 instead of 403 to prevent information disclosure
- **Email Validation**: `visitor_email` cannot be changed after booking creation

### Error Handling & User Experience

- **Validation Errors**: Return 400 Bad Request with field-specific error messages
- **Google Calendar Errors**: Database operations are rolled back, clear error messages provided
- **Authentication Errors**: Return 401 Unauthorized
- **Permission Errors**: Return 404 Not Found (for privacy)
- **Overlap Conflicts**: Detailed messages showing existing booking information
- **Time Zone Errors**: Clear indication of which timezone is being used

### Advanced Features

#### Automatic Status Updates:

- Bookings can be configured to automatically change to `COMPLETED` when `end_datetime` passes
- Status transitions respect business logic (cancelled bookings stay cancelled)

#### Overlap Prevention:

- Real-time validation prevents double bookings
- Considers timezone when determining conflicts
- Excludes cancelled bookings from conflict detection

#### Transaction Safety:

- All operations use database transactions
- Google Calendar failures trigger automatic rollbacks
- Ensures data consistency between database and external calendar

### Example Workflow

1. **Create Booking**: Client sends booking request → Django validates → Creates DB record → Creates Google Calendar event → Returns success (or rolls back on failure)

2. **Update Booking**: Client sends update → Django validates → Updates DB → Syncs Google Calendar → Returns success (or rolls back on failure)

3. **Cancel Booking**: Client sends `cancel_reason` → Django sets status to CANCELLED → Deletes Google Calendar event → Clears `google_event_id` → Returns success (or rolls back on failure)
