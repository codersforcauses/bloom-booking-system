# Backend server

A template Django server.

1. Install dependencies: `poetry install`
2. Run: `python manage.py runserver` or `.\dev.sh`

Note this README file needs to be here otherwise poetry won't recognise this as a valid project.

# Python version

- 3.12

# Google calendar integration

- Place your Google service account JSON key file in `server/api/booking/google_calendar/google_calendar_service.json`
- An example JSON key file is `server/api/booking/google_calendar/google_calendar_service.example.json`
