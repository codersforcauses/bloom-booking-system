import requests
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
def verify_recaptcha(request):
    token = request.data.get("token")
    if not token:
        return Response({"success": False, "error": "Missing token"}, status=400)

    secret = settings.RECAPTCHA_SECRET_KEY
    data = {
        "secret": secret,
        "response": token,
    }
    r = requests.post(
        "https://www.google.com/recaptcha/api/siteverify", data=data)
    result = r.json()
    return Response({"success": result.get("success", False)})
