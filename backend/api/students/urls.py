from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BehaviorIncidentsViewSet, BehaviorRatingsViewSet, HealthConditionsViewSet, ParentRelationShipViewSet, ParentViewSet, StudentHealthRecordsViewSet, StudentViewSet, ParentStudentViewSet
from .parent_views import ParentLoginView, ParentDashboardView, ParentProfileView
from .teacher_rating_views import TeacherRatingViewSet, TeacherRatingByParentView

router = DefaultRouter()
router.register(r'parents', ParentViewSet)
router.register(r'students', StudentViewSet)
router.register(r'parent_students', ParentStudentViewSet)
router.register(r'parent_relationships', ParentRelationShipViewSet)
router.register(r'health_conditions', HealthConditionsViewSet)
router.register(r'student_health_records', StudentHealthRecordsViewSet)
router.register(r'behavior_incidents', BehaviorIncidentsViewSet)
router.register(r'behavior_ratings', BehaviorRatingsViewSet)
router.register(r'parent-teacher-ratings', TeacherRatingViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('parent/login/', ParentLoginView.as_view(), name='parent-login'),
    path('parent/dashboard/', ParentDashboardView.as_view(), name='parent-dashboard'),
    path('parent/dashboard/<uuid:student_id>/', ParentDashboardView.as_view(), name='parent-dashboard-student'),
    path('parent/profile/', ParentProfileView.as_view(), name='parent-profile'),
    path('teacher-ratings/', TeacherRatingByParentView.as_view({'get': 'list'}), name='teacher-ratings-by-parent'),
]

