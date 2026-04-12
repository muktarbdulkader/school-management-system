"""
Materials & Data Export URLs
"""
from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views

router = SimpleRouter()
router.register(r'resource-requests', views.ResourceRequestViewSet, basename='resource-request')
router.register(r'digital-resources', views.DigitalResourceViewSet, basename='digital-resource')

urlpatterns = [
    path('export/students/', views.export_students, name='export-students'),
    path('export/teachers/', views.export_teachers, name='export-teachers'),
    path('export/attendance/', views.export_attendance, name='export-attendance'),
    path('export/grades/', views.export_grades, name='export-grades'),
    path('export/report-card/<str:student_id>/', views.export_report_card, name='export-report-card'),
    path('', include(router.urls)),
]
