import pytest
import os
from api.booking.google_calendar.events import (
    create_event,
    get_event,
    update_event,
    delete_event,
)
# skip if no Google Calendar env variables are set
pytestmark = pytest.mark.skipif(
    not os.getenv("GOOGLE_CREDENTIALS_FILE") or not os.getenv(
        "GOOGLE_CALENDAR_ID"),
    reason="Google Calendar integration env vars missing. Set GOOGLE_CREDENTIALS_FILE and GOOGLE_CALENDAR_ID to run this test."
)


def test_google_calendar_crud():

    event_data = {
        "summary": "Test Event",
        "description": "CRUD test event",
        "start": {
            "dateTime": "2025-12-02T15:00:00",
            "timeZone": "Australia/Perth",
        },
        "end": {
            "dateTime": "2025-12-02T16:00:00",
            "timeZone": "Australia/Perth",
        },
        'recurrence': ['RRULE:FREQ=WEEKLY;COUNT=10'],
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
