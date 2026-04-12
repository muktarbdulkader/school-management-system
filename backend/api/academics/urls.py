from rest_framework.routers import DefaultRouter
from academics.views import ClassElectiveOfferingsViewSet, ClassExtraOfferingsViewSet, ClassesViewSet, ClassSubjectViewSet, CourseTypesViewSet, SectionsViewSet, SubjectsViewSet, StudentElectiveChoicesViewSet, StudentExtraChoicesViewSet, StudentSubjectViewSet, TermsViewSet
from academics.subject_management_views import GlobalSubjectViewSet, ClassSubjectManagementViewSet

router = DefaultRouter()
router.register(r'classes', ClassesViewSet, basename='classes')
router.register(r'class_subjects', ClassSubjectViewSet, basename='class_subjects')
router.register(r'sections', SectionsViewSet, basename='sections')
router.register(r'subjects', SubjectsViewSet, basename='subjects')
router.register(r'student_subjects', StudentSubjectViewSet, basename='student_subjects')
router.register(r'student_electives', StudentElectiveChoicesViewSet, basename='student_electives')
router.register(r'student_extras', StudentExtraChoicesViewSet, basename='student_extras')
router.register(r'terms', TermsViewSet, basename='terms')
router.register(r'elective_offerings', ClassElectiveOfferingsViewSet, basename='elective_offerings')
router.register(r'extra_offerings', ClassExtraOfferingsViewSet, basename='extra_offerings')
router.register(r'course_types', CourseTypesViewSet, basename='course_types')
# New Subject Management endpoints
router.register(r'global_subjects', GlobalSubjectViewSet, basename='global_subjects')
router.register(r'class_subject_management', ClassSubjectManagementViewSet, basename='class_subject_management')

urlpatterns = router.urls
