from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from .models import CustomUser


class CustomUserCreationForm(forms.ModelForm):
    """Custom form for creating users with required email"""
    email = forms.EmailField(required=True)
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput,
                                required=True, help_text='Must be at least 8 characters.')
    password2 = forms.CharField(
        label='Password confirmation', widget=forms.PasswordInput, required=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email')

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2:
            if password1 != password2:
                raise forms.ValidationError("Passwords don't match")
            if len(password1) < 8:
                raise forms.ValidationError(
                    "Password must be at least 8 characters long.")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


# Custom form for changing users (password required, with confirmation)
class CustomUserChangeForm(forms.ModelForm):
    # You'll need to re-enter the password or change it when changing user details
    password1 = forms.CharField(
        label='Password', widget=forms.PasswordInput, required=False,
        help_text='Leave blank to keep the current password. Must be at least 8 characters.')
    password2 = forms.CharField(
        label='Password confirmation', widget=forms.PasswordInput, required=False)

    class Meta:
        model = CustomUser
        fields = ('username', 'email')

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 or password2:
            if not password1 or not password2:
                raise forms.ValidationError(
                    'Both password fields are required to change the password.')
            if password1 != password2:
                raise forms.ValidationError("Passwords don't match")
            if len(password1) < 8:
                raise forms.ValidationError(
                    "Password must be at least 8 characters long.")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2:
            user.set_password(password1)
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

    def get_updated_at(self, obj):
        return obj.updated_at
    get_updated_at.short_description = "Updated At"

    readonly_fields = ("last_login", "updated_at")
    # Fieldsets for editing existing users (includes email and password)
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password1', 'password2')}),
        ('Permissions', {'fields': ('is_staff', 'is_active')}),
        ('Important dates', {
         'fields': ('date_joined', "last_login", "updated_at")}),
    )

    # Fieldsets for adding new users (with required email)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )


admin.site.register(CustomUser, CustomUserAdmin)
