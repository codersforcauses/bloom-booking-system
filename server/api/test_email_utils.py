from django.core import mail
from django.utils import timezone
from datetime import timedelta, timezone as dt_timezone
from api.email_utils import send_booking_confirmed_email
from django.test import TestCase, override_settings


class TestBookingConfirmedEmail(TestCase):

    def setUp(self):
        now_local = timezone.localtime(timezone.now())
        self.start = (now_local + timedelta(days=1)).replace(
            hour=10, minute=0, second=0, microsecond=0
        )
        self.context = {
            'start_datetime': self.start,
            'end_datetime': self.start + timedelta(hours=2),
            'room_name': 'Meeting Room 1',
            'booking_id': 33,
            'recurrence_rule': 'FREQ=WEEKLY;COUNT=2'
        }

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', EMAIL_HOST_USER='test@example.com')
    def test_send_email_success_with_ics(self):
        """Verifies email is sent with correctly formatted ICS attachment."""
        recipients = ["test@example.com"]
        result = send_booking_confirmed_email(
            recipients=recipients,
            context=self.context,
            fail_silently=False
        )

        # Check return value (should be 1 if one email sent)
        assert result == 1

        # Check outbox
        assert len(mail.outbox) == 1
        email = mail.outbox[0]
        assert email.to == recipients

        # Check ICS Attachment
        assert len(email.attachments) == 1
        filename, content, mimetype = email.attachments[0]
        assert filename == "booking.ics"
        assert mimetype == "text/calendar"

        # Check ICS Content logic
        expected_start = self.context['start_datetime'].astimezone(dt_timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        expected_end = self.context['end_datetime'].astimezone(dt_timezone.utc).strftime('%Y%m%dT%H%M%SZ')

        assert "BEGIN:VCALENDAR" in content
        assert "SUMMARY:Booking for Meeting Room 1" in content
        assert "UID:booking-33@Bloom" in content
        assert f"DTSTART:{expected_start}" in content
        assert f"DTEND:{expected_end}" in content
        assert "RRULE:FREQ=WEEKLY;COUNT=2" in content
        assert "END:VCALENDAR" in content
