import os
from .client import get_calendar_service

CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID")


def create_event(event_data: dict):
    """Create a new event."""
    service = get_calendar_service()
    return service.events().insert(calendarId=CALENDAR_ID, body=event_data).execute()


def get_event(event_id: str):
    """Retrieve a specific event."""
    service = get_calendar_service()
    return service.events().get(calendarId=CALENDAR_ID, eventId=event_id).execute()


def update_event(event_id: str, updated_data: dict):
    """Update an existing event."""
    service = get_calendar_service()
    return service.events().update(calendarId=CALENDAR_ID, eventId=event_id, body=updated_data).execute()


def delete_event(event_id: str):
    """Delete an event."""
    service = get_calendar_service()
    return service.events().delete(calendarId=CALENDAR_ID, eventId=event_id).execute()
