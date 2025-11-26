import os
from google.oauth2 import service_account
from googleapiclient.discovery import build


def get_calendar_service():
    """Return a Google Calendar API service using a service account."""
    cred_path = os.getenv("GOOGLE_CREDENTIALS_FILE")
    if not cred_path or not os.path.exists(cred_path):
        raise FileNotFoundError("Set GOOGLE_CREDENTIALS_FILE in .env")

    creds = service_account.Credentials.from_service_account_file(
        cred_path,
        scopes=["https://www.googleapis.com/auth/calendar"]
    )
    return build("calendar", "v3", credentials=creds)
