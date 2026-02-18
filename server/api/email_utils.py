import os
from typing import Iterable

from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from datetime import datetime, timezone
from rrule_humanize import humanize
from smtplib import SMTPAuthenticationError, SMTPResponseException, SMTPException

import logging

logger = logging.getLogger(__name__)


# Template paths under api/templates/emails
BOOKING_CONFIRMED_TEMPLATE = "emails/booking_confirmed.html"
BOOKING_CANCELLED_TEMPLATE = "emails/booking_cancelled.html"

"""
Email utilities for booking notifications.

Usage:
- Call `send_booking_confirmed_email` or `send_booking_cancelled_email`
- Pass booking-specific data via the `context` dictionary
- Shared layout and branding (e.g. Bloom logo) are injected automatically

Expected context structure:

Booking confirmed email (`send_booking_confirmed_email`):
context = {
    "booking_id": int,         # required
    "room_name": str,          # required
    "start_datetime": datetime,         # required
    "end_datetime": datetime,           # required
    "recurrence_rule": string,          # optional
    "visitor_name": str,       # required
    "location_name": str,      # required
    "manage_url": str | None,  # optional
}

Booking cancelled email (`send_booking_cancelled_email`):
context = {
    "booking_id": int,         # required
    "room_name": str,          # required
    "start_datetime": datetime,         # required
    "end_datetime": datetime,           # required
    "recurrence_rule": string,          # optional
    "book_room_url": str | None,  # optional
}

Shared variables (injected automatically):
- bloom_logo_url: str

Templates:
- emails/base_booking_email.html (shared layout)
- emails/booking_confirmed.html
- emails/booking_cancelled.html
"""


def get_bloom_logo_url() -> str:
    """
    URL for the Bloom logo used in emails.

    Uses BLOOM_LOGO_URL from settings if present, otherwise falls
    back to the static path (useful for local/dev).
    """
    logo_url = getattr(settings, "BLOOM_LOGO_URL", None)
    if logo_url:
        return logo_url

    # Fallback – relative static path; fine for local / console email previews
    return os.environ.get("FRONTEND_URL", "") + "images/bloom_logo.png"


def requires_email_exists(func):
    def wrapper(*args, **kwargs):
        if not settings.EMAIL_HOST_USER:
            logger.warning(
                "EMAIL_HOST_USER is not set. Emails will not be sent.")
            return 0
        return func(*args, **kwargs)
    return wrapper


@requires_email_exists
def send_simple_email(
    subject: str,
    recipients: Iterable[str],
    *,
    html_template: str | None = None,
    context: dict | None = None,
    from_email: str | None = None,
    fail_silently: bool = False,
) -> int:
    """
    Wrapper for Django's send_mail using EMAIL_HOST_USER.

    - If `html_template` is provided, it renders that template with `context`
      and sends it as HTML email.
    - Existing plain-text usage still works: pass `subject`,
      and `recipients` without `html_template`.
    """
    if from_email is None:
        from_email = settings.EMAIL_HOST_USER

    html_message = None

    if html_template is not None:
        context = context or {}
        html_message = render_to_string(html_template, context)

    # Attempts to send email. If authentication fails with bad credentials, log an error but keep the app running.
    try:
        return send_mail(
            subject=subject,
            message="",
            from_email=from_email,
            recipient_list=list(recipients),
            fail_silently=fail_silently,
            html_message=html_message,
        )
    except SMTPAuthenticationError:
        logger.error(
            "Failed to send email: SMTP authentication error. from_email=%r",
            from_email,
        )
        return 0
    except SMTPResponseException as e:
        if e.smtp_code == 530:
            logger.error("Failed to send email: SMTP authentication required.")
            return 0
        raise


@requires_email_exists
def send_email_with_attachments(
    subject: str,
    recipients: Iterable[str],
    *,
    attachments: list[tuple[str, str, str]],
    html_template: str | None = None,
    context: dict | None = None,
    from_email: str | None = None,
    fail_silently: bool = False,
) -> int:
    if from_email is None:
        from_email = settings.EMAIL_HOST_USER

    html_message = None

    if html_template is not None:
        context = context or {}
        html_message = render_to_string(html_template, context)

    # Using EmailMultiAlternatives instead of send_mail
    email = EmailMultiAlternatives(
        subject=subject,
        body="",
        from_email=from_email,
        to=list(recipients),
    )

    if html_message:
        email.attach_alternative(html_message, "text/html")

    # Loop through and attach files
    for filename, content, mimetype in attachments:
        email.attach(filename, content, mimetype)

    try:
        return email.send(fail_silently=fail_silently)
    except SMTPAuthenticationError:
        logger.error(
            "Failed to send email: SMTP authentication error. from_email=%r",
            from_email,
        )
        if fail_silently:
            return 0
        raise
    except SMTPResponseException as e:
        if e.smtp_code == 530:
            logger.error("Failed to send email: SMTP authentication required.")
        else:
            logger.error("SMTP Response Error: %s - %s",
                         e.smtp_code, e.smtp_msg)
        if fail_silently:
            return 0
        raise
    except (SMTPException, OSError) as e:
        logger.error("Failed to send email with attachment: %s", e)
        if fail_silently:
            return 0
        raise


def send_booking_confirmed_email(
    recipients: Iterable[str],
    *,
    context: dict,
    subject: str = "Booking confirmed!",
    fail_silently: bool = False,
) -> int:
    """
    Convenience wrapper for the booking confirmed HTML template.
    Expects `context` to match the variables used in
    emails/booking_confirmed.html.
    """
    ctx = dict(context or {})
    ctx.setdefault("bloom_logo_url", get_bloom_logo_url())

    start_dt = context.get('start_datetime')
    end_dt = context.get('end_datetime')
    booking_id = context.get('booking_id', 'unknown')
    room_name = context.get('room_name', 'Bloom Meeting Room')
    rrule_str = context.get('recurrence_rule')

    if not start_dt or not end_dt:
        logger.error("Missing required datetime objects in context.")
        return 0

    start_utc = start_dt.astimezone(timezone.utc)
    end_utc = end_dt.astimezone(timezone.utc)

    start_str = start_utc.strftime('%Y%m%dT%H%M%SZ')
    end_str = end_utc.strftime('%Y%m%dT%H%M%SZ')

    dtstamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    uid = f"booking-{booking_id}@Bloom"

    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Bloom//EN",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstamp}",
        f"SUMMARY:Bloom room booking - {room_name}",
        f"DTSTART:{start_str}",
        f"DTEND:{end_str}",
    ]

    # Only add the RRULE line if it has content
    if rrule_str:
        # Ensure it starts with RRULE: if it doesn't already
        if not rrule_str.startswith("RRULE:"):
            rrule_str = f"RRULE:{rrule_str}"
        ics_lines.append(rrule_str)

    ics_lines.extend([
        f"DESCRIPTION:Room: {context['room_name']}, Location: {context['location_name']}, Visitor: {context['visitor_name']}",
        "END:VEVENT",
        "END:VCALENDAR"
    ])

    ics_content = "\r\n".join(ics_lines)

    if rrule_str:
        ctx["recurrence_rule_human"] = humanize(rrule_str)
    else:
        ctx["recurrence_rule_human"] = None

    return send_email_with_attachments(
        subject=subject,
        recipients=recipients,
        html_template=BOOKING_CONFIRMED_TEMPLATE,
        context=ctx,
        fail_silently=fail_silently,
        attachments=[("booking.ics", ics_content, "text/calendar")],
    )


def send_booking_cancelled_email(
    recipients: Iterable[str],
    *,
    context: dict,
    subject: str = "Booking cancelled!",
    fail_silently: bool = False,
) -> int:
    """
    Convenience wrapper for the booking cancelled HTML template.
    Expects `context` to match the variables used in
    emails/booking_cancelled.html.
    """
    ctx = dict(context or {})
    ctx.setdefault("bloom_logo_url", get_bloom_logo_url())

    rrule_str = context.get('recurrence_rule')
    if rrule_str:
        ctx["recurrence_rule_human"] = humanize(rrule_str)
    else:
        ctx["recurrence_rule_human"] = None

    return send_simple_email(
        subject=subject,
        recipients=recipients,
        html_template=BOOKING_CANCELLED_TEMPLATE,
        context=ctx,
        fail_silently=fail_silently,
    )
