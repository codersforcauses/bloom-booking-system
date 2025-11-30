from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from django import forms


class CustomUserCreationForm(forms.ModelForm):
    """Custom form for creating users with required email"""
    email = forms.EmailField(required=True)
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(
        label='Password confirmation', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('username', 'email')

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


# Custom form for changing users (password required)
class CustomUserChangeForm(forms.ModelForm):
    password = forms.CharField(
        label='Password', widget=forms.PasswordInput, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def clean_password(self):
        password = self.cleaned_data.get('password')
        if not password:
            raise forms.ValidationError('Password is required.')
        return password

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
        return user


class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    list_display = ("id", "username", "email", "date_joined", "last_login",
                    "get_updated_at", "is_staff", "is_active")
    list_display_links = ("username",)  # Make username clickable for editing
    search_fields = ("username", "email")

    # Methods to display UserProfile fields
    def get_updated_at(self, obj):
        try:
            return obj.profile.updated_at
        except AttributeError:
            return "No profile"
    get_updated_at.short_description = "Updated At"

    # Fieldsets for editing existing users (includes email and password)
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Permissions', {'fields': ('is_staff', 'is_active')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    # Fieldsets for adding new users (with required email)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
