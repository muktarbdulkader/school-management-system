from rest_framework.routers import DefaultRouter
from schedule.views import ClassScheduleSlotsViewSet, LeaveRequestViewSet, SlotTypesViewSet, StudentScheduleOverridesViewSet, AttendanceViewSet, ExamsViewSet, SubjectExamDaysViewSet, ClassroomViewSet

router = DefaultRouter()

router.register(r'schedule_slots', ClassScheduleSlotsViewSet, basename='scheduleـslots')
router.register(r'schedule_overrides', StudentScheduleOverridesViewSet, basename='scheduleـoverrides')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'leave_requests', LeaveRequestViewSet, basename='leave_requests') 
router.register(r'exams', ExamsViewSet, basename='exams')
router.register(r'exam_days', SubjectExamDaysViewSet, basename='exam_days')
router.register(r'slot_types', SlotTypesViewSet, basename='slot_types')
router.register(r'classrooms', ClassroomViewSet, basename='classrooms')

urlpatterns = router.urls