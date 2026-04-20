// Reusable API base URL from environment variable
const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_SMS_URL || 'http://localhost:8000';

// Backend API Configuration
const Backend = {
  api: `${API}/api/`,
  auth: `${API}/api/`,

  // Authentication
  login: 'token/',
  refreshToken: 'token/refresh/',
  logout: 'logout/',
  resetPassword: 'password_reset/',
  setPassword: 'create-password/',
  verifyOtp: 'verify-otp/',
  changePassword: 'change_password/',

  // Users & Profiles
  users: 'users/',
  userRegister: 'register/',
  myProfile: 'profiles/',
  updateProfileImage: 'update-profile-image/',
  removeProfileImage: 'remove-profile-image/',
  userStatus: 'users/', // Base for /users/{id}/update_status/
  userChangePassword: 'users/', // Base for /users/{id}/change-password/

  // Roles & Permissions
  roles: 'roles/',
  userRoles: 'user_roles/',
  permissions: 'role_permissions/',

  // Branches
  branches: 'branches/',
  userBranchAccess: 'user_branch_access/',

  // Students
  students: 'students/',
  studentsDetail: 'students/{id}/',
  parents: 'parents/',
  parentStudents: 'parent_students/',
  parentAvailableTeachers: 'parent_students/available_teachers/',
  parentRelationships: 'parent_relationships/',
  healthConditions: 'health_conditions/',
  studentHealthRecords: 'student_health_records/',
  behaviorIncidents: 'behavior_incidents/',
  behaviorRatings: 'behavior_ratings/',

  // Teachers
  teachers: 'teachers/',
  teacherMe: 'teachers/me/',
  teachersOverviewDashboard: 'teachers/overview_dashboard/',
  teachersClassDashboard: 'teachers/class_dashboard',
  teachersMyStudents: 'teachers/my_students/',
  teachersStudentDetail: 'teachers/my_students/{student_id}/',
  teachersStudentBehaviorRatings: 'teachers/student_behavior_ratings/',
  teachersRateBehavior: 'behavior_ratings/',
  teachersAttendanceDashboard: 'teachers/attendance_dashboard/',
  teachersMarkAttendance: 'teachers/mark_attendance/',
  teachersBulkMarkAttendance: 'teachers/bulk_mark_attendance/',
  teachersClassAssessments: 'teachers/class_assessments',
  teacherTasks: 'teacher-tasks/',
  teacherRatings: 'teacher-ratings/',
  teacherRatingsSubmit: 'teacher-ratings/submit/',
  teachersPerformanceRatings: 'teacher-ratings/',
  teacherMetrics: 'teacher-metrics/',
  teacherReports: 'teacher-reports/',

  // Dynamic Performance Measurement (New)
  performanceCriteria: 'performance-criteria/',
  performanceCriteriaActive: 'performance-criteria/active/',
  performanceCriteriaBulkCreate: 'performance-criteria/bulk-create/',
  performanceEvaluations: 'performance-evaluations/',
  myPerformanceEvaluations: 'performance-evaluations/my-evaluations/',
  performanceEvaluationByTeacher: (teacherId) => `performance-evaluations/by-teacher/${teacherId}/`,
  performanceEvaluationSubmit: (id) => `performance-evaluations/${id}/submit/`,
  performanceEvaluationReview: (id) => `performance-evaluations/${id}/review/`,
  performanceEvaluationApprove: (id) => `performance-evaluations/${id}/approve/`,

  // Academics
  classes: 'classes/',
  sections: 'sections/',
  subjects: 'subjects/',
  studentSubjects: 'student_subjects/',
  studentElectives: 'student_electives/',
  studentExtras: 'student_extras/',
  terms: 'terms/',
  electiveOfferings: 'elective_offerings/',
  extraOfferings: 'extra_offerings/',
  classSubjectTeachers: 'teacher_assignments/',  // Updated to use TeacherAssignment model
  teacherAssignments: 'teacher_assignments/',  // New TeacherAssignment API
  courseTypes: 'course_types/',

  // Schedule & Attendance
  scheduleSlots: 'schedule_slots/',
  classScheduleSlots: 'schedule_slots/',
  scheduleOverrides: 'schedule_overrides/',
  attendance: 'attendance/',
  leaveRequests: 'leave_requests/',
  exams: 'exams/',
  examDays: 'exam_days/',
  slotTypes: 'slot_types/',

  // Lesson Topics & Planning
  objectiveCategories: 'objective_categories/',
  objectiveUnits: 'objective_units/',
  objectiveSubunits: 'objective_subunits/',
  createObjectiveCategory: 'objective_categories/',
  createObjectiveUnit: 'objective_units/',
  createObjectiveSubunit: 'objective_subunits/',
  learningObjectives: 'learning_objectives/',
  lessonPlans: 'lesson_plans/',
  lessonActivities: 'lesson_activities/',
  lessonPlanEvaluations: 'lesson_plan_evaluations/',
  lessonPlanObjectives: 'lesson_plan_objectives/',
  assignments: 'assignments/',
  studentAssignments: 'student_assignments/',
  examResults: 'exam_results/',

  // Report Cards & Curriculum
  reportCards: 'report_cards/',
  reportCardSubjects: 'report_card_subjects/',
  curriculumMappings: 'curriculum_mappings/',
  classUnitProgress: 'class_unit_progress/',
  classSubunitProgress: 'class_subunit_progress/',
  generateReportCards: 'report_cards/generate/',

  learningObjectivesTeacherObjectives: 'learning_objectives/teacher_objectives/',
  teachersClassUnits: 'objective_units/teachers_class_units/',
  teachersSetCurrentUnit: 'objective_units/set_current_unit/',
  teachersMarkUnitCompleted: 'objective_units/mark_unit_completed/',
  teachersMarkSubunitCompleted: 'objective_subunits/mark_subunit_completed/',

  // Lesson planning (teacher-scoped)
  getMyPlans: 'lesson_plans/',
  getMyEvaluationFeedback: 'lesson_plan_evaluations/',
  getMyLessonActivities: 'lesson_activities/',

  // Communication
  communicationChats: 'communication/chats/',
  communicationChatsTeacherStudentsContacts: 'communication/chats/teacher_students_contacts/',
  chatHistory: 'communication/chat_history/',
  communicationMeetings: 'communication/meetings/',
  communicationMeetingRequests: 'communication/meetings/',
  announcements: 'communication/announcements/',
  communicationNotifications: 'communication/notifications/',
  groupChats: 'communication/group_chats/',
  groupChatMembers: 'communication/group_chat_members/',
  groupChatMessages: 'communication/group_chat_messages/',
  feedbacks: 'communication/feedbacks/',
  meetingApprove: 'communication/meetings/', // Base for /{id}/approve/
  meetingReject: 'communication/meetings/', // Base for /{id}/reject/
  meetingComplete: 'communication/meetings/', // Base for /{id}/mark_completed/
  // Feedback aliases used by RatingsandComments page
  communicationFeedbacksEligibleUsers: 'teachers/',
  communicationFeedbacksParentFeedback: 'communication/feedbacks/parent_feedback/',

  // Blogs
  blogCategories: 'blog_categories/',
  blogPosts: 'blog_posts/',
  blogComments: 'blog_comments/',

  // Library
  libraryBooks: 'library/books/',
  libraryMembers: 'library/members/',
  libraryBorrowings: 'library/borrowings/',
  libraryMyBorrowings: 'library/borrowings/my_borrowings/',
  libraryAvailableBooks: 'library/books/available/',
  libraryReturnBook: 'library/borrowings/{id}/return/',
  libraryOverdueBooks: 'library/borrowings/overdue/',

  // Materials & Resource Requests
  resourceRequests: 'materials/resource-requests/',
  resourceRequestsMyRequests: 'materials/resource-requests/my-requests/',
  resourceRequestsPending: 'materials/resource-requests/pending/',
  resourceRequestsStatistics: 'materials/resource-requests/statistics/',
  resourceRequestApprove: 'materials/resource-requests/{id}/approve-reject/',
  resourceRequestComplete: 'materials/resource-requests/{id}/complete/',

  // Data Export
  exportStudents: 'materials/export/students/',
  exportTeachers: 'materials/export/teachers/',
  exportAttendance: 'materials/export/attendance/',
  exportGrades: 'materials/export/grades/',
  exportReportCard: 'materials/export/report-card/{student_id}/',

  // Tasks & To-Do Management
  tasks: 'tasks/',
  myTasks: 'tasks/my_tasks/',
  tasksCreatedByMe: 'tasks/created_by_me/',
  tasksStatistics: 'tasks/statistics/',
  tasksOverdue: 'tasks/overdue/',
  taskComments: 'tasks/comments/',
  taskDelegations: 'tasks/delegations/',
  taskReminders: 'tasks/reminders/',
  taskHistory: 'tasks/history/',
  myKPIS: 'tasks/kpi_plans/',
  employeeTasks: 'tasks/employee_tasks/',
  employeeSubTasks: 'tasks/employee_subtasks/',
  employeeTaskStatus: 'tasks/employee_tasks/',
  employeeSubTaskStatus: 'tasks/employee_subtasks/',
  clonWeeklyTask: 'tasks/employee_tasks/clone_weekly/',
  fiscalYear: 'tasks/fiscal_years/',

  // Custom Teacher Actions
  teacherTaskComplete: 'teacher-tasks/{id}/complete/',
  teacherRankings: 'teacher-reports/rankings/',
  teacherAssignmentDetail: 'teacher_assignments/teacher-detail/',
  classSubjects: 'class_subjects/',
  classSubjectManagement: 'class_subject_management/',

  // Custom Student/Parent Actions
  studentMe: 'students/me/',
  studentSubjectsEnrollAll: 'classes/{class_id}/enroll_all_class_subjects/',
  digitalResources: 'materials/digital-resources/',
  otpRequest: 'users/request-otp/',
  otpVerify: 'users/verify-otp/',
  parentChildren: 'parent_students/children/',
  parentStudentDashboard: 'parent/dashboard/{student_id}/',
  parentStudentsDashboard: 'parent/dashboard/',
  parentStudentAttendanceDetails: 'parent_students/attendance_details/{student_id}/',
  parentStudentAcademicProgress: 'parent_students/academic_progress/{student_id}/',
  parentStudentAssignmentDashboard: 'parent_students/assignment_dashboard/{student_id}/',
  // aliases used by child-profile page
  parentStudentsAcademicProgress: 'parent_students/academic_progress/',
  parentStudentsParentSubjectObjectives: 'parent_students/parent_subject_objectives/',
  // Teacher-specific endpoint for student subject assignments with submissions
  teacherSubjectAssignments: 'parent_students/teacher_subject_assignments/',
  behaviorIncidentsTodayIncidents: 'behavior_incidents/today_incidents/',

  // Custom Communication Actions
  chatsConversations: 'communication/chats/conversations/',
  chatsConversation: 'communication/chats/conversation/',
  meetingReschedule: 'communication/meetings/{id}/reschedule/',
  meetingCancel: 'communication/meetings/{id}/cancel/',
  meetingArchived: 'communication/meetings/archived/',
  meetingAddFeedback: 'communication/meetings/{id}/add_feedback/',
  meetingFeedbacks: 'communication/meetings/feedbacks/',
  meetingFeedback: 'communication/meetings/{id}/feedback/',
  announcementsUrgent: 'communication/announcements/urgent/',
  groupChatConversations: 'communication/group_chat_messages/conversations/',
  groupChatConversation: 'communication/group_chat_messages/conversation/{group_id}/',
  parentFeedback: 'communication/feedbacks/parent_feedback/',

  // Custom Academic Actions
  studentSubjectsEnrollCoreSubjects: 'classes/enroll_core_subjects/{class_id}/',
  studentSubjectsEnrollAll: 'classes/{class_id}/enroll_all_class_subjects/', // Action path suffix remains manual or handled in dashboard

  // Custom Schedule Actions
  attendanceDailySummary: 'attendance/daily_summary/',
  scheduleStudentSchedule: 'schedule_slots/student_schedule/{student_id}/',
  leaveRequestCancel: 'leave_requests/{id}/cancel_leave_request/',
  leaveRequestArchived: 'leave_requests/archived/',
  leaveRequestApprove: 'leave_requests/{id}/approve_leave/',
  leaveRequestReject: 'leave_requests/{id}/reject_leave/',
  PendingLeavesRequests: 'leave_requests/pending_leaves/',
  studentLeavesHistory: 'leave_requests/student_leaves/{student_id}/',

  // Legacy/Unused endpoints (kept for backward compatibility - may need cleanup)
  patients: 'patients',
  getVisits: 'get-visits',
  complaints: 'complaints',
  ocularHistories: 'ocular-histories',
  medicalHistories: 'medical-histories',
  visualAcuities: 'visual-acuities',
  ocularMotilities: 'ocular-motilities',
  intraocularPressures: 'intraocular-pressures',
  adnexaExamination: 'adnexa-examinations',
  slitLampExaminations: 'slit-lamp-examinations',
  initialImpressions: 'initial-impressions',
  fundusExaminations: 'fundus-examinations',

  // Performance/KPI endpoints (may need backend implementation)
  myUnit: 'my-unit',
  units: 'units',
  allUnits: 'all-units',
  unitByTypes: 'unit-by-type/',
  types: 'unit-types',
  employees: 'employees',
  employeeDashboard: 'get-employee-home-dashboard',
  kpi: 'kpis',
  getStats: 'get-counts',
  preSetups: 'kpi-pre-setups',
  fiscalYear: 'get-fiscal-year',
  periods: 'periods',
  frequencies: 'frequencies',
  planningPeriods: 'get-planing-period',
  workflows: 'workflows',
  myNotification: 'my-notifications',
  readNotification: 'read-notification/',
  readAllNotification: 'read-all-notifications',
  teacherTasks: 'teacher-tasks/',
  teacherReports: 'teacher-reports/',
  teacherPerformance: 'teacher-reports/',
};

// Debug: Log API configuration on load
console.log('🔧 Backend API Configuration:', {
  api: Backend.api,
  auth: Backend.auth,
  VITE_API_URL: import.meta.env.VITE_API_URL
});

export default Backend;
