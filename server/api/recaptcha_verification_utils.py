import requests
from django.conf import settings


def verify_recaptcha(value):
    response = requests.post(
        'https://www.google.com/recaptcha/api/siteverify',
        data={
            'secret': settings.RECAPTCHA_SECRET_KEY,
            'response': value
        },
        timeout=5,
    )
    result = response.json()
    return result.get('success', False)
