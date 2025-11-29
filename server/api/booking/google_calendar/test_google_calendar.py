from api.booking.google_calendar.events import (
    create_event,
    get_event,
    update_event,
    delete_event,
)


def test_google_calendar_crud():

    event_data = {
        "summary": "Test Event",
        "description": "CRUD test event",
        "start": {
            "dateTime": "2025-11-29T15:00:00",
            "timeZone": "Australia/Perth",
        },
        "end": {
            "dateTime": "2025-11-29T16:00:00",
            "timeZone": "Australia/Perth",
        },
    }

    created = create_event(event_data)
    event_id = created["id"]

    fetched = get_event(event_id)
    assert fetched["summary"] == "Test Event"

    updated_data = dict(event_data)
    updated_data["summary"] = "Updated Test Event"

    updated = update_event(event_id, updated_data)
    assert updated["summary"] == "Updated Test Event"

    delete_event(event_id)
