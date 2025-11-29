import os
from google.oauth2 import service_account
from googleapiclient.discovery import build


def get_calendar_service():
    """
    Create and return a Google Calendar API service client using a service account.

    Returns:
        googleapiclient.discovery.Resource: Authenticated Calendar API service.

    Raises:
        FileNotFoundError: If GOOGLE_CREDENTIALS_FILE is not set or the file does not exist.
    """
    cred_path = os.getenv("GOOGLE_CREDENTIALS_FILE")

    if not cred_path or not os.path.exists(cred_path):
        raise FileNotFoundError(
            "GOOGLE_CREDENTIALS_FILE is missing or the file path is invalid. "
            "Set it in your .env file."
        )

    creds = service_account.Credentials.from_service_account_file(
        cred_path,
        scopes=["https://www.googleapis.com/auth/calendar"]
    )

    return build("calendar", "v3", credentials=creds)
