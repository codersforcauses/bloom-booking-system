import requests
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
def verify_recaptcha(request):
    token = request.data.get("token")
    if not token:
        return Response({"success": False, "error": "Missing token"}, status=400)

    secret = getattr(settings, "RECAPTCHA_SECRET_KEY", None)
    if not secret:
        return Response({"success": False, "error": "Recaptcha secret key is not configured"}, status=500)

    data = {
        "secret": secret,
        "response": token,
    }
    try:
        r = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data=data,
            timeout=5,
        )
        r.raise_for_status()
        result = r.json()
    except (requests.exceptions.RequestException, ValueError):
        # Network/HTTP/JSON error while contacting the reCAPTCHA service
        return Response(
            {"success": False, "error": "reCAPTCHA verification failed"},
            status=502,
        )
    success = bool(result.get("success", False))
    response_data = {"success": success}
    # If verification failed and Google returned error codes, include them
    error_codes = result.get("error-codes")
    if not success and error_codes:
        response_data["error_codes"] = error_codes
    return Response(response_data, status=200 if success else 400)
