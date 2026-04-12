from django import forms
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission
from .models import RolePermission, Role

class RolePermissionForm(forms.ModelForm):
    content_type = forms.ModelChoiceField(
        queryset=ContentType.objects.filter(app_label='users'),
        label="Model"
    )
    permission = forms.ModelChoiceField(
        queryset=Permission.objects.all(),
        label="Permission"
    )

    class Meta:
        model = RolePermission
        fields = ['role', 'content_type', 'permission']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields['permission'].queryset = Permission.objects.filter(
                content_type=self.instance.content_type
            )