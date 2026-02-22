"""
Calendar API views for fetching Google Calendar events for rooms.
"""

import logging

from googleapiclient.errors import HttpError
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .client import get_calendar_service

from ...room.models import Room
import os

logger = logging.getLogger(__name__)
CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "")


@api_view(["GET"])
def get_room_calendar_events(request):
    """
    Get calendar events for a specific room within a date range.

    Query Parameters:
    - roomId: The ID of the room
    - timeMin: ISO 8601 datetime string (e.g., "2026-02-01")
    - timeMax: ISO 8601 datetime string (e.g., "2026-02-28")

    Returns:
    - List of calendar events from Google Calendar
    """
    try:
        # Get query parameters
        room_id = request.query_params.get("roomId")
        time_min = request.query_params.get("timeMin")
        time_max = request.query_params.get("timeMax")

        # Validate required parameters
        if not room_id:
            return Response(
                {"error": "roomId is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not time_min or not time_max:
            return Response(
                {"error": "timeMin and timeMax are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the room and validate it exists
        try:
            Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response(
                {"error": f"Room with id {room_id} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Convert date strings to ISO 8601 datetime format for Google Calendar API
        # Ensure the dates have time component and timezone
        try:
            # Parse the date strings and add timezone if not present
            if "T" not in time_min:
                # Perth timezone (UTC+8)
                time_min = f"{time_min}T00:00:00+08:00"
            if "T" not in time_max:
                # Perth timezone (UTC+8)
                time_max = f"{time_max}T23:59:59+08:00"
        except Exception as date_error:
            logger.error(f"Error parsing dates: {date_error}")
            return Response(
                {"error": "Invalid date format. Expected YYYY-MM-DD or ISO 8601 datetime"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get Google Calendar service
        try:
            service = get_calendar_service()
        except Exception as service_error:
            logger.error(
                f"Failed to initialize calendar service: {service_error}")
            return Response(
                {"error": "Failed to connect to Google Calendar service"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Fetch events from Google Calendar
        try:
            events_result = (
                service.events()
                .list(
                    calendarId=CALENDAR_ID,
                    timeMin=time_min,
                    timeMax=time_max,
                    singleEvents=True,  # Expand recurring events
                    orderBy="startTime",
                    maxResults=2500,  # Google Calendar API limit
                    sharedExtendedProperty=[f"roomId={room_id}"],
                )
                .execute()
            )

            events = events_result.get("items", [])

            # Transform events to match frontend expectations
            is_auth = request.user.is_authenticated
            formatted_events = []
            for event in events:
                raw_summary = event.get("summary", "")
                if is_auth:
                    summary = raw_summary
                else:
                    summary = raw_summary.split("-")[0].strip() if raw_summary else ""
                formatted_events.append({
                    "summary": summary,
                    "description": event.get("description", ""),
                    "start": event.get("start", {}),
                    "end": event.get("end", {}),
                })

            return Response(formatted_events, status=status.HTTP_200_OK)

        except HttpError as http_error:
            logger.error(f"Google Calendar API error: {http_error}")
            return Response(
                {"error": f"Google Calendar API error: {str(http_error)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    except Exception as error:
        logger.error(f"Unexpected error fetching calendar events: {error}")
        return Response(
            {"error": f"An unexpected error occurred: {error}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
