from django.core import mail
from django.utils import timezone
from datetime import timedelta, timezone as dt_timezone
from api.email_utils import send_booking_confirmed_email, send_booking_cancelled_email
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
            'recurrence_rule': 'FREQ=WEEKLY;COUNT=2',
            'visitor_name': 'Jane Doe',
            'location_name': 'Floor 3',
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
        assert "SUMMARY:Bloom room booking - Meeting Room 1" in content
        assert "UID:booking-33@Bloom" in content
        assert f"DTSTART:{expected_start}" in content
        assert f"DTEND:{expected_end}" in content
        assert "RRULE:FREQ=WEEKLY;COUNT=2" in content
        assert "END:VCALENDAR" in content

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', EMAIL_HOST_USER='test@example.com')
    def test_send_email_without_recurrence(self):
        """Verifies RRULE is omitted from ICS when recurrence_rule is absent."""
        context = {**self.context, 'recurrence_rule': None}
        result = send_booking_confirmed_email(
            recipients=["test@example.com"],
            context=context,
            fail_silently=False,
        )

        assert result == 1
        _, content, _ = mail.outbox[0].attachments[0]
        assert "RRULE" not in content

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', EMAIL_HOST_USER='')
    def test_send_email_no_host_user_returns_zero(self):
        """Verifies that no email is sent when EMAIL_HOST_USER is not configured."""
        result = send_booking_confirmed_email(
            recipients=["test@example.com"],
            context=self.context,
            fail_silently=False,
        )
        assert result == 0
        assert len(mail.outbox) == 0


class TestBookingCancelledEmail(TestCase):

    def setUp(self):
        now_local = timezone.localtime(timezone.now())
        start = (now_local + timedelta(days=1)).replace(
            hour=10, minute=0, second=0, microsecond=0
        )
        self.context = {
            'start_datetime': start,
            'end_datetime': start + timedelta(hours=2),
            'room_name': 'Meeting Room 1',
            'booking_id': 42,
            'recurrence_rule': 'FREQ=DAILY;COUNT=3',
        }

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', EMAIL_HOST_USER='test@example.com')
    def test_send_cancelled_email_success(self):
        """Verifies cancelled email is sent without an ICS attachment."""
        recipients = ["attendee@example.com"]
        result = send_booking_cancelled_email(
            recipients=recipients,
            context=self.context,
            fail_silently=False,
        )

        assert result == 1
        assert len(mail.outbox) == 1
        email = mail.outbox[0]
        assert email.to == recipients
        assert email.attachments == []

    @override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', EMAIL_HOST_USER='')
    def test_send_cancelled_email_no_host_user_returns_zero(self):
        """Verifies that no email is sent when EMAIL_HOST_USER is not configured."""
        result = send_booking_cancelled_email(
            recipients=["attendee@example.com"],
            context=self.context,
            fail_silently=False,
        )
        assert result == 0
        assert len(mail.outbox) == 0
