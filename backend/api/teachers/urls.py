from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeacherViewSet, TeacherTaskViewSet, TeacherPerformanceRatingViewSet, TeacherMetricsViewSet, TeacherPerformanceReportViewSet, TeacherAssignmentViewSet

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet, basename='teachers')
router.register(r'teacher-tasks', TeacherTaskViewSet, basename='teacher-tasks')
router.register(r'teacher-ratings', TeacherPerformanceRatingViewSet, basename='teacher-ratings')
router.register(r'teacher-metrics', TeacherMetricsViewSet, basename='teacher-metrics')
router.register(r'teacher-reports', TeacherPerformanceReportViewSet, basename='teacher-reports')
router.register(r'teacher_assignments', TeacherAssignmentViewSet, basename='teacher-assignments')

urlpatterns = router.urls
