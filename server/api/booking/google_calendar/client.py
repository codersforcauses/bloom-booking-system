import os
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv

# -----------------------------
# Resolve BASE_DIR and load .env
# -----------------------------
# adjust to server root
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Use environment variable for Google credentials
cred_path = os.getenv("GOOGLE_CREDENTIALS_FILE")

# -----------------------------
# Validate credentials file
# -----------------------------
if not cred_path or not os.path.exists(cred_path):
    raise FileNotFoundError(
        f"GOOGLE_CREDENTIALS_FILE is missing or invalid.\nChecked: {os.path.abspath(cred_path)}"
    )

# -----------------------------
# Create Google Calendar service
# -----------------------------


def get_calendar_service():
    creds = service_account.Credentials.from_service_account_file(
        cred_path,
        scopes=["https://www.googleapis.com/auth/calendar"]
    )
    return build("calendar", "v3", credentials=creds)
