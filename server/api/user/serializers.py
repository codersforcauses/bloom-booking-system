from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework import exceptions


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            user = authenticate(username=attrs['username'], password=attrs['password'])
        except exceptions.ValidationError:
            # If username authentication fails, try email authentication
            try:
                user = authenticate(email=attrs['username'], password=attrs['password'])
            except exceptions.ValidationError:
                # If email authentication also fails, or 'username' field is not provided
                raise exceptions.AuthenticationFailed('Invalid credentials')

        if not user:
            raise exceptions.AuthenticationFailed('Invalid credentials')

        self.user = user

        refresh = self.get_token(user)
        data = {}
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)

        return data
