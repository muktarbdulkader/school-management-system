from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    ObjectiveCategoriesViewSet, ObjectiveUnitsViewSet, ObjectiveSubunitsViewSet, 
    LearningObjectivesViewSet, LessonPlansViewSet, LessonActivitiesViewSet, 
    LessonPlanEvaluationsViewSet, LessonPlanObjectivesViewSet, AssignmentsViewSet, 
    StudentAssignmentsViewSet, ExamResultsViewSet, ReportCardViewSet, ReportCardSubjectViewSet,
    CurriculumMappingViewSet, ClassUnitProgressViewSet, ClassSubunitProgressViewSet
)

router = DefaultRouter()
router.register(r'objective_categories', ObjectiveCategoriesViewSet)
router.register(r'objective_units', ObjectiveUnitsViewSet)
router.register(r'objective_subunits', ObjectiveSubunitsViewSet)
router.register(r'learning_objectives', LearningObjectivesViewSet)
router.register(r'lesson_plans', LessonPlansViewSet)
router.register(r'lesson_activities', LessonActivitiesViewSet)
router.register(r'lesson_plan_evaluations', LessonPlanEvaluationsViewSet)
router.register(r'lesson_plan_objectives', LessonPlanObjectivesViewSet)
router.register(r'assignments', AssignmentsViewSet)
router.register(r'student_assignments', StudentAssignmentsViewSet)
router.register(r'exam_results', ExamResultsViewSet)
router.register(r'report_cards', ReportCardViewSet, basename='reportcards')
router.register(r'report_card_subjects', ReportCardSubjectViewSet, basename='reportcardsubjects')
router.register(r'curriculum_mappings', CurriculumMappingViewSet, basename='curriculummappings')
router.register(r'class_unit_progress', ClassUnitProgressViewSet, basename='classunitprogress')
router.register(r'class_subunit_progress', ClassSubunitProgressViewSet, basename='classsubunitprogress')

urlpatterns = [
    path('', include(router.urls)),
]