# api/booking/google_calendar/test_google_calendar_mock.py

from unittest.mock import patch, MagicMock
from api.booking.google_calendar import events


@patch("api.booking.google_calendar.events.get_calendar_service")
def test_create_event(mock_service):
    # Create a fake service client
    mock_client = MagicMock()
    mock_service.return_value = mock_client

    # Call the create_event function
    events.create_event({"summary": "Test Event"})

    # Assert that insert was called
    mock_client.events.return_value.insert.assert_called_once()


@patch("api.booking.google_calendar.events.get_calendar_service")
def test_get_event(mock_service):
    mock_client = MagicMock()
    mock_service.return_value = mock_client

    events.get_event("123")

    mock_client.events.return_value.get.assert_called_once()


@patch("api.booking.google_calendar.events.get_calendar_service")
def test_update_event(mock_service):
    mock_client = MagicMock()
    mock_service.return_value = mock_client

    events.update_event("123", {"summary": "Updated"})

    mock_client.events.return_value.update.assert_called_once()


@patch("api.booking.google_calendar.events.get_calendar_service")
def test_delete_event(mock_service):
    mock_client = MagicMock()
    mock_service.return_value = mock_client

    events.delete_event("123")

    mock_client.events.return_value.delete.assert_called_once()
