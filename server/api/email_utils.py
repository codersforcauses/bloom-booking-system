from django.conf import settings
from django.core.mail import send_mail
from typing import Iterable


def send_simple_email(
    subject: str,
    message: str,
    recipients: Iterable[str],
    *,
    from_email: str | None = None,
    fail_silently: bool = False,
) -> int:
    """
    Wrapper for Django's send_mail using DEFAULT_FROM_EMAIL.
    """
    if from_email is None:
        from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER

    return send_mail(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=list(recipients),
        fail_silently=fail_silently,
    )
