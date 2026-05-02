"""
Materials & Data Export URLs
"""
from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views

router = SimpleRouter()
router.register(r'resource-requests', views.ResourceRequestViewSet, basename='resource-request')
router.register(r'digital-resources', views.DigitalResourceViewSet, basename='digital-resource')

# Export URLs must be defined before router URLs to avoid conflicts
export_urlpatterns = [
    path('export/students/', views.export_students, name='export-students'),
    path('export/teachers/', views.export_teachers, name='export-teachers'),
    path('export/attendance/', views.export_attendance, name='export-attendance'),
    path('export/grades/', views.export_grades, name='export-grades'),
    path('export/report-card/<str:student_id>/', views.export_report_card, name='export-report-card'),
    # Teacher-specific exports (filtered by teacher's assigned classes)
    path('export/teacher/attendance/', views.export_teacher_attendance, name='export-teacher-attendance'),
    path('export/teacher/grades/', views.export_teacher_grades, name='export-teacher-grades'),
]

# Resource assignment dropdown endpoints
assignment_urlpatterns = [
    path('resource-classes/', views.get_classes_for_resource_assignment, name='resource-classes'),
    path('resource-students/', views.get_students_for_resource_assignment, name='resource-students'),
    path('resource-teachers/', views.get_teachers_for_resource_assignment, name='resource-teachers'),
]

# Teacher-specific endpoints
teacher_urlpatterns = [
    path('teacher-assignments/', views.get_teacher_assignments, name='teacher-assignments'),
    path('teacher-students/', views.get_teacher_students, name='teacher-students'),
]

urlpatterns = export_urlpatterns + assignment_urlpatterns + teacher_urlpatterns + [
    path('', include(router.urls)),
]
