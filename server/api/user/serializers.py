from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework import exceptions
from django.contrib.auth import get_user_model


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    '''
    Custom serializer to allow authentication with either username or email
    '''
    def validate(self, attrs):
        username_or_email = attrs.get('username')
        password = attrs.get('password')
        user = authenticate(username=username_or_email, password=password)

        if not user:
            User = get_user_model()
            try:
                user_obj = User.objects.get(email=username_or_email)
            except User.DoesNotExist:
                user_obj = None

            if user_obj:
                user = authenticate(username=user_obj.username, password=password)

        if not user:
            raise exceptions.AuthenticationFailed('Invalid credentials')

        self.user = user

        refresh = self.get_token(user)
        data = {}
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)

        return data
