"""
Task Management URLs
"""
from rest_framework.routers import DefaultRouter
from .views import (
    TaskViewSet, TaskCommentViewSet, TaskDelegationViewSet, 
    TaskReminderViewSet, TaskHistoryViewSet,
    FiscalYearViewSet, KPIPlanViewSet, 
    EmployeeTaskViewSet, EmployeeSubTaskViewSet
)

router = DefaultRouter()
router.register(r'fiscal_years', FiscalYearViewSet, basename='fiscal-years')
router.register(r'kpi_plans', KPIPlanViewSet, basename='kpi-plans')
router.register(r'employee_tasks', EmployeeTaskViewSet, basename='employee-tasks')
router.register(r'employee_subtasks', EmployeeSubTaskViewSet, basename='employee-subtasks')
router.register(r'comments', TaskCommentViewSet, basename='task-comments')
router.register(r'delegations', TaskDelegationViewSet, basename='task-delegations')
router.register(r'reminders', TaskReminderViewSet, basename='task-reminders')
router.register(r'history', TaskHistoryViewSet, basename='task-history')
router.register(r'', TaskViewSet, basename='tasks')

urlpatterns = router.urls
