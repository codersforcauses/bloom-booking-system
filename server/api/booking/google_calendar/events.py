import os
from .client import get_calendar_service


def requires_calendar_id(func):
    def wrapper(*args, **kwargs):
        CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID")
        if not CALENDAR_ID:
            raise ValueError(
                "GOOGLE_CALENDAR_ID is missing. Set it in your environment."
            )
        return func(CALENDAR_ID, *args, **kwargs)
    return wrapper


@requires_calendar_id
def create_event(CALENDAR_ID, event_data: dict):
    """
    Create a new Google Calendar event.

    **Expected event_data keys (Google Calendar API format):**
    - summary (str): Title of the event.
    - description (str, optional): Details about the event.
    - location (str, optional): Physical or virtual location.
    - start (dict): Start date/time.
        Example:
        {
            "dateTime": "2025-02-01T10:00:00+08:00",
            "timeZone": "Australia/Perth"
        }
    - end (dict): End date/time.
        Example:
        {
            "dateTime": "2025-02-01T11:00:00+08:00",
            "timeZone": "Australia/Perth"
        }
    - 'recurrence': ['RRULE:FREQ=WEEKLY;COUNT=10'].
    Returns:
        dict: The created event object from Google Calendar.
    """
    service = get_calendar_service()
    return service.events().insert(calendarId=CALENDAR_ID, body=event_data).execute()


@requires_calendar_id
def get_event(CALENDAR_ID, event_id: str):
    """
    Retrieve a specific event.

    Args:
        event_id (str): Google Calendar event ID.

    Returns:
        dict: Event details.
    """
    service = get_calendar_service()
    return service.events().get(calendarId=CALENDAR_ID, eventId=event_id).execute()


@requires_calendar_id
def update_event(CALENDAR_ID, event_id: str, updated_data: dict):
    """
    Update an existing event.

    Args:
        event_id (str): Google Calendar event ID.
        updated_data (dict): Same structure as event_data.

    Returns:
        dict: Updated event object.
    """
    service = get_calendar_service()
    return service.events().update(calendarId=CALENDAR_ID, eventId=event_id, body=updated_data).execute()


@requires_calendar_id
def delete_event(CALENDAR_ID, event_id: str):
    """
    Delete an event.

    Args:
        event_id (str): Google Calendar event ID.

    Returns:
        dict: Response from Google Calendar API (usually empty).
    """
    service = get_calendar_service()
    return service.events().delete(calendarId=CALENDAR_ID, eventId=event_id).execute()
