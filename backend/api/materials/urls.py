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
    # Resource assignment dropdown endpoints
    path('resource-classes/', views.get_classes_for_resource_assignment, name='resource-classes'),
    path('resource-students/', views.get_students_for_resource_assignment, name='resource-students'),
    path('resource-teachers/', views.get_teachers_for_resource_assignment, name='resource-teachers'),
    path('', include(router.urls)),
]
