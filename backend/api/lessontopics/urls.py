from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    ObjectiveCategoriesViewSet, ObjectiveUnitsViewSet, ObjectiveSubunitsViewSet,
    LearningObjectivesViewSet, LessonPlansViewSet, LessonActivitiesViewSet,
    LessonPlanEvaluationsViewSet, LessonPlanObjectivesViewSet, AssignmentsViewSet,
    StudentAssignmentsViewSet, ExamResultsViewSet, ReportCardViewSet, ReportCardSubjectViewSet,
    CurriculumMappingViewSet, ClassUnitProgressViewSet, ClassSubunitProgressViewSet
)
from .views_k12 import (
    ContinuousAssessmentViewSet, SkillsAssessmentViewSet,
    TeacherCommentViewSet, StudentRankViewSet
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

# K-12 Assessment Routes
router.register(r'continuous_assessments', ContinuousAssessmentViewSet, basename='continuousassessments')
router.register(r'skills_assessments', SkillsAssessmentViewSet, basename='skillsassessments')
router.register(r'teacher_comments', TeacherCommentViewSet, basename='teachercomments')
router.register(r'student_ranks', StudentRankViewSet, basename='studentranks')

urlpatterns = [
    path('', include(router.urls)),
]