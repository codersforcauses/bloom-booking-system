# Room API Endpoints

## Authentication

- **Read (GET):** Anyone can list or retrieve rooms.
- **Write (POST, PATCH, PUT):** Only authenticated users can create or update rooms.
- **Delete:** Not allowed (returns 405).

---

## List Rooms

**GET** `/api/rooms/`

### Query Parameters (all optional):

- `name`: Filter rooms by name (case-insensitive, partial match).
- `location`: Filter by location name (case-insensitive, partial match).
- `min_capacity`: Minimum capacity (integer).
- `max_capacity`: Maximum capacity (integer).
- `min_datetime`: Start datetime after or equal to (ISO 8601).
- `max_datetime`: End datetime before or equal to (ISO 8601).
- `amenity`: Filter by amenity name(s). Comma-separated for multiple.  
  Example: `?amenity=Projector,Whiteboard`

**Pagination:**  
Results are paginated (10 per page by default). Use `?page=2` for next page.

**Example Request:**

```
GET /api/rooms/?name=meeting&location=Main&min_capacity=5&amenity=Projector,Whiteboard
```

---

## Retrieve Room

**GET** `/api/rooms/{id}/`

Returns details for a single room.

---

## Create Room

**POST** `/api/rooms/`  
**Auth required**

**Body Example:**

```json
{
  "name": "Conference Room",
  "location": 1,
  "capacity": 20,
  "amenities_id": [1, 2],
  "start_datetime": "2025-12-11T09:00:00Z",
  "end_datetime": "2025-12-11T18:00:00Z",
  "recurrence_rule": "FREQ=DAILY;BYDAY=MO,TU,WE",
  "is_active": true
}
```

---

## Update Room

**PATCH/PUT** `/api/rooms/{id}/`  
**Auth required**

**Body:** Same as create. Partial updates allowed.

---

## Delete Room

**DELETE** `/api/rooms/{id}/`  
**Not allowed** (returns 405 Method Not Allowed).

---

## Retrieve rooms availability

**GET** `/api/rooms/availability`

Returns availability of rooms in a boolean format. A room is available if the room has any free slot that overlaps with the requested time range (the time range must be at least partly later than now). In other words, a room is available if it has slot that can be booked.

### Query Parameters (all optional):

- `start_datetime`: Start datetime after or equal to (ISO 8601). Note: Date string is not accepted.
- `end_datetime`: End datetime before or equal to (ISO 8601). Note: Date string is not accepted.

**Pagination:**  
Results are paginated (10 per page by default). Use `?page=2` for next page. Room_id returned in each page will be the same as /rooms.

**Example Request:**

```
http://localhost:8000/api/rooms/availability/?start_datetime=2026-01-19T12:00:00+0800&end_datetime=2026-01-19T14:00:00+0800
```

---

## Retrieve room availability

**GET** `/api/rooms/{id}/availability`

Returns availabile slots for a single room. Slots returned will only include time later than now.

### Query Parameters:

- `start_date`: Start date after or equal to (YYYY-MM-DD). Optional.
- `end_date`: End date before or equal to (YYYY-MM-DD). Required.

**Example Request:**

```
GET /api/rooms/1/availability/?start_date=2026-01-05&end_date=2026-01-11
```

---

## Notes

- Unauthenticated users only see rooms where `is_active=true`.
- A room cannot be deleted but you can change its `is_active`
- Filtering by multiple amenities returns rooms that have **all** specified amenities.
- Validation: `end_datetime` must be after `start_datetime`.
- Validation: `recurrence_rule` must start with FREQ= and contain valid frequency

---

## Related Endpoints

- **Locations:** `/api/locations/`
- **Amenities:** `/api/amenities/`
