from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (TeacherViewSet, TeacherTaskViewSet, TeacherPerformanceRatingViewSet,
                    TeacherMetricsViewSet, TeacherPerformanceReportViewSet, TeacherAssignmentViewSet,
                    PerformanceMeasurementCriteriaViewSet, TeacherPerformanceEvaluationViewSet)

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet, basename='teachers')
router.register(r'teacher-tasks', TeacherTaskViewSet, basename='teacher-tasks')
router.register(r'teacher-ratings', TeacherPerformanceRatingViewSet, basename='teacher-ratings')
router.register(r'teacher-metrics', TeacherMetricsViewSet, basename='teacher-metrics')
router.register(r'teacher-reports', TeacherPerformanceReportViewSet, basename='teacher-reports')
router.register(r'teacher_assignments', TeacherAssignmentViewSet, basename='teacher-assignments')
router.register(r'performance-criteria', PerformanceMeasurementCriteriaViewSet, basename='performance-criteria')
router.register(r'performance-evaluations', TeacherPerformanceEvaluationViewSet, basename='performance-evaluations')

urlpatterns = router.urls
