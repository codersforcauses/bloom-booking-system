from django.http import HttpResponse


# /test route
def test(request):
    return HttpResponse("Hello, Django!")
