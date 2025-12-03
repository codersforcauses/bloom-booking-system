import os
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv


# Resolve BASE_DIR and load .env
# adjust to server root
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(os.path.join(BASE_DIR, ".env"))

cred_path = os.getenv("GOOGLE_CREDENTIALS_FILE")
calendar_id = os.getenv("GOOGLE_CALENDAR_ID")


def get_calendar_service():

    if not cred_path:
        raise FileNotFoundError(
            "GOOGLE_CREDENTIALS_FILE is missing or invalid. "
            f"Checked: {os.path.join(BASE_DIR, '.env')}"
        )

    creds = service_account.Credentials.from_service_account_file(
        cred_path,
        scopes=["https://www.googleapis.com/auth/calendar"]
    )
    return build("calendar", "v3", credentials=creds)
