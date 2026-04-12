import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import Protected from 'Protected';

// dashboard routing
const Home = Loadable(lazy(() => import('views/dashboard')));
const Units = Loadable(lazy(() => import('views/units')));
const MyUnits = Loadable(lazy(() => import('views/units/my_units')));
const ViewUnit = Loadable(lazy(() => import('views/units/view')));
const Planning = Loadable(lazy(() => import('views/planning')));
const PlanDetail = Loadable(lazy(() => import('views/planning/planDetail')));
const CurriculumUnitsManager = Loadable(lazy(() => import('views/curriculum-units')));
const FeedBacks = Loadable(lazy(() => import('views/feedbacks')));
const Coaching = Loadable(lazy(() => import('views/coaching')));
const EODReport = Loadable(lazy(() => import('views/EodReport/EodReport')));
const TeacherReports = Loadable(lazy(() => import('views/EodReport/EodReport')));
const EodReportView = Loadable(
  lazy(() => import('views/myTeamEodReport/EdoReportView')),
);

const MyTeamsEODReport = Loadable(lazy(() => import('views/myTeamEodReport')));
const PlanningStatus = Loadable(
  lazy(() => import('views/planning/planning-status')),
);
const TaskStatus = Loadable(lazy(() => import('views/my-teams/task-status')));
const Employees = Loadable(lazy(() => import('views/employees')));

const EmployeesPlanRemove = Loadable(
  lazy(() => import('views/employees/components/EmployeesPlanRemove')),
);
const EmployeesRemovedPlanLog = Loadable(
  lazy(() => import('views/employees/components/EmployeesRemovedPlanLog')),
);
const MyEmployees = Loadable(
  lazy(() => import('views/employees/my_employees')),
);
const ViewEmployee = Loadable(lazy(() => import('views/employees/view')));
const ViewPatients = Loadable(lazy(() => import('views/patients/view')));
const ViewVisitPatients = Loadable(
  lazy(() => import('views/visit_patients/view')),
);

const ParentLeaveRequestsPage = Loadable(
  lazy(() => import('views/Leave-request')),
);

const ViewTaskEmployee = Loadable(
  lazy(() => import('views/dashboard/components/hr/view')),
);
const ViewEmployeeFeedBack = Loadable(
  lazy(() => import('views/feedbacks/feedBack')),
);
const ViewCoaching = Loadable(lazy(() => import('views/coaching/coaching')));

const ViewEodReport = Loadable(lazy(() => import('views/EodReport/EodReport')));

const ViewMyFeedBack = Loadable(
  lazy(() => import('views/feedbacks/myFeedBack')),
);
const PerformanceRating = Loadable(
  lazy(() => import('views/settings/performance-ratings')),
);
const Perspectives = Loadable(
  lazy(() => import('views/settings/perspectives')),
);
const MeasuringUnits = Loadable(
  lazy(() => import('views/settings/measuring-units')),
);
const Periods = Loadable(lazy(() => import('views/settings/periods')));
const MonitoringSettings = Loadable(
  lazy(() => import('views/settings/monitoring-settings')),
);
const Frequencies = Loadable(lazy(() => import('views/settings/frequencies')));
const NotFound = Loadable(lazy(() => import('views/not-found')));
const ViewTask = Loadable(lazy(() => import('views/approvals/view')));

const Ranking = Loadable(lazy(() => import('views/ranking')));
const Performance = Loadable(lazy(() => import('views/performance')));
const PerKPIPerformanceReport = Loadable(
  lazy(() => import('views/Report/components/per-kpi-performance')),
);
const Tasks = Loadable(lazy(() => import('views/tasks/TasksPage')));
const Todo = Loadable(lazy(() => import('views/tasks/TasksPage')));
const Approvals = Loadable(lazy(() => import('views/approvals')));
const ViewApprovalTask = Loadable(lazy(() => import('views/approvals/view')));

//////////////// new imports ////////////////
const Messages = Loadable(lazy(() => import('views/chat')));
const MessagesTeacher = Loadable(lazy(() => import('views/chatTeacher')));
const Ratings = Loadable(lazy(() => import('views/RatingsandComments')));
const RatingStudents = Loadable(lazy(() => import('views/RatingStudents')));
const Classes = Loadable(lazy(() => import('views/classes')));
const Attendance = Loadable(lazy(() => import('views/classes/AttendanceMark')));
const TermManagement = Loadable(lazy(() => import('views/terms')));
const ClassDetail = Loadable(
  lazy(() => import('views/classes/components/ClassDetail')),
);
const MeetingHistory = Loadable(lazy(() => import('views/meeting-history')));
const LearningObjectives = Loadable(
  lazy(() => import('views/classes/learning-objectives')),
);
const TeacherRatingsPage = Loadable(lazy(() => import('views/teacher-ratings')));
const MeetingRequestsPage = Loadable(lazy(() => import('views/meeting-requests')));
const Grades = Loadable(lazy(() => import('views/Grade')));
const TeachersClassUnits = Loadable(
  lazy(() => import('views/classes/teachers-class-units')),
);
const MyTasks = Loadable(lazy(() => import('views/teachers/MyTasks')));
const MyReports = Loadable(lazy(() => import('views/teachers/MyReports')));
const MyPerformance = Loadable(lazy(() => import('views/teachers/MyPerformance')));
const ChildProfile = Loadable(lazy(() => import('views/child-profile')));
const DashboardDetail = Loadable(
  lazy(
    () => import('views/dashboard/components/techer-dashoard/DashboardDetail'),
  ),
);

// New SMS Management Pages
const StudentsPage = Loadable(lazy(() => import('views/students')));
const TeachersPage = Loadable(lazy(() => import('views/teachers')));
const AddTeacherPage = Loadable(lazy(() => import('views/teachers/AddTeacher')));
const ParentsPage = Loadable(lazy(() => import('views/parents')));
const SchedulePage = Loadable(lazy(() => import('views/schedule')));
const AnnouncementsPage = Loadable(lazy(() => import('views/announcements')));
const AssignmentsPage = Loadable(lazy(() => import('views/assignments')));
const BehaviorPage = Loadable(lazy(() => import('views/behavior')));
const BlogPage = Loadable(lazy(() => import('views/blog')));
const BlogPostDetail = Loadable(lazy(() => import('views/blog/BlogPostDetail')));
const StudentClassesPage = Loadable(lazy(() => import('views/student-classes')));
const MySubjectsPage = Loadable(lazy(() => import('views/students/my-subjects')));
const LibraryPage = Loadable(lazy(() => import('views/library')));
const UploadResourcePage = Loadable(lazy(() => import('views/library/UploadResource')));
const ResourceRequestsPage = Loadable(lazy(() => import('views/resource-requests')));
const DataExportPage = Loadable(lazy(() => import('views/data-export')));
const TeacherPerformancePage = Loadable(lazy(() => import('views/teacher-performance')));
const HealthRecordsPage = Loadable(lazy(() => import('views/health')));
const SectionsPage = Loadable(lazy(() => import('views/sections')));
const SubjectsPage = Loadable(lazy(() => import('views/subjects')));
const CourseTypesPage = Loadable(lazy(() => import('views/course-types')));
const ClassSubjectAssignmentsPage = Loadable(lazy(() => import('views/class-subject-assignments')));
const AdminClassManage = Loadable(lazy(() => import('views/classes/AdminClassManage')));
const CreateClassPage = Loadable(lazy(() => import('views/classes/CreateClass')));
const FinanceOverviewPage = Loadable(lazy(() => import('views/finance')));
///////////////// end  of new import ////////////////

const EvaluationApproval = Loadable(
  lazy(() => import('views/approvals/evaluation-approval')),
);
const MyEvaluations = Loadable(
  lazy(() => import('views/evaluation/my-evaluations')),
);
const Monitoring = Loadable(lazy(() => import('views/monitoring')));
const Revision = Loadable(lazy(() => import('views/revision')));
const MonitoringReport = Loadable(lazy(() => import('views/monitoringReport')));
const ViewPlan = Loadable(lazy(() => import('views/planning/View')));
const Account = Loadable(lazy(() => import('views/account')));
const KPIManagement = Loadable(lazy(() => import('views/kpi')));
const Users = Loadable(lazy(() => import('views/users')));
const BranchAccess = Loadable(lazy(() => import('views/users/BranchAccess')));
const Patients = Loadable(lazy(() => import('views/patients')));
const VisitPatients = Loadable(lazy(() => import('views/visit_patients')));

const Workflows = Loadable(lazy(() => import('views/workflows')));
const Report = Loadable(lazy(() => import('views/Report')));
const Viewoverallcompany = Loadable(
  lazy(() => import('views/Report/admin_side/UnitDetailView')),
);
const ViewKpiDetail = Loadable(
  lazy(() => import('views/Report/admin_side/KpiDetailView')),
);
const Job = Loadable(lazy(() => import('views/job-positions/index')));
// const Todo = Loadable(lazy(() => import('views/todo')));
const MyTeam = Loadable(lazy(() => import('views/my-teams')));
const ViewTeamMemberTasks = Loadable(lazy(() => import('views/my-teams/view')));

// utilities routing
const UtilsColor = Loadable(lazy(() => import('views/utilities/Color')));
const UtilsShadow = Loadable(lazy(() => import('views/utilities/Shadow')));
const BasicConfigPage = Loadable(
  lazy(() => import('views/settings/view/basic-config')),
);
const EodActivityPage = Loadable(lazy(() => import('views/Eod/EodActivity')));
const RolePermission = Loadable(
  lazy(() => import('views/roles_permission/Page')),
);
const Unauthorized = Loadable(lazy(() => import('utils/unautorized')));

// sample page routingkpiMange-view
const Testpage = Loadable(lazy(() => import('views/sample-page/test')));
const Fortest = Loadable(lazy(() => import('views/dashboard/index')));

// admin routing


// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: '/',
      element: (
        <Protected>
          <Home />
        </Protected>
      ),
    },
    {
      path: 'home',
      element: (
        <Protected>
          <Home />
        </Protected>
      ),
    },

    {
      path: 'account',
      element: (
        <Protected>
          <Account />
        </Protected>
      ),
    },

    // SMS Management Routes
    {
      path: 'students',
      element: (
        <Protected>
          <StudentsPage />
        </Protected>
      ),
    },
    {
      path: 'teachers',
      element: (
        <Protected>
          <TeachersPage />
        </Protected>
      ),
    },
    {
      path: 'teachers/add',
      element: (
        <Protected>
          <AddTeacherPage />
        </Protected>
      ),
    },
    {
      path: 'parents',
      element: (
        <Protected>
          <ParentsPage />
        </Protected>
      ),
    },
    {
      path: 'teacher-performance',
      element: (
        <Protected>
          <TeacherPerformancePage />
        </Protected>
      ),
    },
    {
      path: 'schedule',
      element: (
        <Protected>
          <SchedulePage />
        </Protected>
      ),
    },
    {
      path: 'announcements',
      element: (
        <Protected>
          <AnnouncementsPage />
        </Protected>
      ),
    },
    {
      path: 'assignments',
      element: (
        <Protected>
          <AssignmentsPage />
        </Protected>
      ),
    },
    {
      path: 'behavior',
      element: (
        <Protected>
          <BehaviorPage />
        </Protected>
      ),
    },
    {
      path: 'blog',
      element: (
        <Protected>
          <BlogPage />
        </Protected>
      ),
    },
    {
      path: 'blog/:id',
      element: (
        <Protected>
          <BlogPostDetail />
        </Protected>
      ),
    },
    {
      path: 'teacher-ratings',
      element: (
        <Protected>
          <TeacherRatingsPage />
        </Protected>
      ),
    },
    {
      path: 'meeting-requests',
      element: (
        <Protected>
          <MeetingRequestsPage />
        </Protected>
      ),
    },
    {
      path: 'grades',
      element: (
        <Protected>
          <Grades />
        </Protected>
      ),
    },
    {
      path: 'attendance',
      element: (
        <Protected>
          <Attendance />
        </Protected>
      ),
    },
    {
      path: 'terms',
      element: (
        <Protected>
          <TermManagement />
        </Protected>
      ),
    },
    {
      path: 'health-records',
      element: (
        <Protected>
          <HealthRecordsPage />
        </Protected>
      ),
    },

    {
      path: 'employees',
      element: (
        <Protected>
          <Employees />
        </Protected>
      ),
    },
    {
      path: 'employees_plan_remove',
      element: (
        <Protected>
          <EmployeesPlanRemove />
        </Protected>
      ),
    },
    {
      path: 'delated_plan_log',
      element: (
        <Protected>
          <EmployeesRemovedPlanLog />
        </Protected>
      ),
    },
    {
      path: 'my_employees',
      element: (
        <Protected>
          <MyEmployees />
        </Protected>
      ),
    },

    {
      path: 'employees/view',
      element: (
        <Protected>
          <ViewEmployee />
        </Protected>
      ),
    },
    {
      path: 'patients/view',
      element: (
        <Protected>
          <ViewPatients />
        </Protected>
      ),
    },
    {
      path: 'visit_patients/view',
      element: (
        <Protected>
          <ViewVisitPatients />
        </Protected>
      ),
    },
    {
      path: 'visit_patients',
      element: (
        <Protected>
          <VisitPatients />
        </Protected>
      ),
    },
    {
      path: 'hr/view',
      element: (
        <Protected>
          <ViewTaskEmployee />
        </Protected>
      ),
    },
    {
      path: 'employeesFeedBack/view',
      element: (
        <Protected>
          <ViewEmployeeFeedBack />
        </Protected>
      ),
    },
    {
      path: 'coaching/view',
      element: (
        <Protected>
          <ViewCoaching />
        </Protected>
      ),
    },
    {
      path: 'EodReport/view',
      element: (
        <Protected>
          <ViewEodReport />
        </Protected>
      ),
    },
    {
      path: '/myTeamEodReport/EodReportView',
      element: (
        <Protected>
          <EodReportView />
        </Protected>
      ),
    },

    {
      path: 'myFeedBacks',
      element: (
        <Protected>
          <ViewMyFeedBack />
        </Protected>
      ),
    },
    {
      path: 'units',
      element: (
        <Protected>
          <Units />
        </Protected>
      ),
    },
    {
      path: 'my_units',
      element: (
        <Protected>
          <MyUnits />
        </Protected>
      ),
    },

    {
      path: 'units/view',
      element: (
        <Protected>
          <ViewUnit />
        </Protected>
      ),
    },

    {
      path: 'planning',
      element: (
        <Protected>
          <Planning />
        </Protected>
      ),
    },

    {
      path: 'planning/view',
      element: (
        <Protected>
          <ViewPlan />
        </Protected>
      ),
    },

    {
      path: 'planning/details',
      element: (
        <Protected>
          <PlanDetail />
        </Protected>
      ),
    },
    {
      path: 'curriculum-units',
      element: (
        <Protected>
          <CurriculumUnitsManager />
        </Protected>
      ),
    },
    {
      path: 'feedbacks',
      element: (
        <Protected>
          <FeedBacks />
        </Protected>
      ),
    },
    {
      path: 'coaching',
      element: (
        <Protected>
          <Coaching />
        </Protected>
      ),
    },
    {
      path: 'EODReport',
      element: (
        <Protected>
          <EODReport />
        </Protected>
      ),
    },
    {
      path: 'MyTeamsEODReport',
      element: (
        <Protected>
          <MyTeamsEODReport />
        </Protected>
      ),
    },
    {
      path: 'planning/status',
      element: (
        <Protected>
          <PlanningStatus />
        </Protected>
      ),
    },
    {
      path: 'task/status',
      element: (
        <Protected>
          <TaskStatus />
        </Protected>
      ),
    },
    {
      path: 'monitoring',
      element: (
        <Protected>
          <Monitoring />
        </Protected>
      ),
    },
    {
      path: 'monitoringReport',
      element: (
        <Protected>
          <MonitoringReport />
        </Protected>
      ),
    },
    {
      path: 'Revision',
      element: (
        <Protected>
          <Revision />
        </Protected>
      ),
    },

    //////////////more routes////////////////////
    {
      path: 'messages',
      element: (
        <Protected>
          <Messages />
        </Protected>
      ),
    },

    {
      path: 'messages_teacher',
      element: (
        <Protected>
          <MessagesTeacher />
        </Protected>
      ),
    },
    {
      path: 'ratings',
      element: (
        <Protected>
          <Ratings />
        </Protected>
      ),
    },
    {
      path: 'RatingStudents',
      element: (
        <Protected>
          <RatingStudents />
        </Protected>
      ),
    },
    {
      path: 'classes',
      element: (
        <Protected>
          <Classes />
        </Protected>
      ),
    },
    {
      path: 'sections',
      element: (
        <Protected>
          <SectionsPage />
        </Protected>
      ),
    },
    {
      path: 'subjects',
      element: (
        <Protected>
          <SubjectsPage />
        </Protected>
      ),
    },
    {
      path: 'my-subjects',
      element: (
        <Protected>
          <MySubjectsPage />
        </Protected>
      ),
    },
    {
      path: 'library',
      element: (
        <Protected>
          <LibraryPage />
        </Protected>
      ),
    },
    {
      path: 'library/upload',
      element: (
        <Protected>
          <UploadResourcePage />
        </Protected>
      ),
    },
    {
      path: 'resource-requests',
      element: (
        <Protected>
          <ResourceRequestsPage />
        </Protected>
      ),
    },
    {
      path: 'data-export',
      element: (
        <Protected>
          <DataExportPage />
        </Protected>
      ),
    },
    {
      path: 'course-types',
      element: (
        <Protected>
          <CourseTypesPage />
        </Protected>
      ),
    },
    {
      path: 'class-subject-assignments',
      element: (
        <Protected>
          <ClassSubjectAssignmentsPage />
        </Protected>
      ),
    },
    {
      path: 'classes/manage/:classId',
      element: (
        <Protected>
          <AdminClassManage />
        </Protected>
      ),
    },
    {
      path: 'admin/classes/create',
      element: (
        <Protected>
          <CreateClassPage />
        </Protected>
      ),
    },
    {
      path: 'finance',
      element: (
        <Protected>
          <FinanceOverviewPage />
        </Protected>
      ),
    },
    {
      path: 'classes/AttendanceMark',
      element: (
        <Protected>
          <Attendance />
        </Protected>
      ),
    },
    {
      path: 'classes/detail/:classId/:sectionId/:subjectId',
      element: (
        <Protected>
          <ClassDetail />
        </Protected>
      ),
    },
    {
      path: 'meeting-history',
      element: (
        <Protected>
          <MeetingHistory />
        </Protected>
      ),
    },
    {
      path: 'learning-objectives',
      element: (
        <Protected>
          <LearningObjectives />
        </Protected>
      ),
    },
    {
      path: 'teachers-class-units',
      element: (
        <Protected>
          <TeachersClassUnits />
        </Protected>
      ),
    },
    {
      path: 'child-profile/:studentId',
      element: (
        <Protected>
          <ChildProfile />
        </Protected>
      ),
    },
    {
      path: 'teacher-overview',
      element: (
        <Protected>
          <DashboardDetail />
        </Protected>
      ),
    },
    {
      path: 'dashboard/components/techer-dashoard/DashboardDetail',
      element: (
        <Protected>
          <DashboardDetail />
        </Protected>
      ),
    },

    ///////////end of more routes////////////////////

    {
      path: 'leave-requests',
      element: (
        <Protected>
          <ParentLeaveRequestsPage />
        </Protected>
      ),
    },

    {
      path: 'evaluation-approval',
      element: (
        <Protected>
          <EvaluationApproval />
        </Protected>
      ),
    },

    {
      path: 'my-evaluations',
      element: (
        <Protected>
          <MyEvaluations />
        </Protected>
      ),
    },

    {
      path: 'tasks',
      element: (
        <Protected>
          <Tasks />
        </Protected>
      ),
    },
    {
      path: 'teacher-tasks',
      element: (
        <Protected>
          <MyTasks />
        </Protected>
      ),
    },
    {
      path: 'todo',
      element: (
        <Protected>
          <Todo />
        </Protected>
      ),
    },
    {
      path: 'myreport',
      element: (
        <Protected>
          <MyReports />
        </Protected>
      ),
    },
    {
      path: 'teacher-reports',
      element: (
        <Protected>
          <MyReports />
        </Protected>
      ),
    },
    {
      path: 'myperformance',
      element: (
        <Protected>
          <MyPerformance />
        </Protected>
      ),
    },
    {
      path: 'teacher-tasks',
      element: (
        <Protected>
          <MyTasks />
        </Protected>
      ),
    },

    {
      path: 'task/detail',
      element: (
        <Protected>
          <ViewTask />
        </Protected>
      ),
    },

    {
      path: 'approvals',
      element: (
        <Protected>
          <Approvals />
        </Protected>
      ),
    },
    {
      path: 'approval/view',
      element: (
        <Protected>
          <ViewApprovalTask />
        </Protected>
      ),
    },

    {
      path: 'workflows',
      element: (
        <Protected>
          <Workflows />
        </Protected>
      ),
    },

    {
      path: 'performance',
      element: (
        <Protected>
          <Performance />
        </Protected>
      ),
    },
    {
      path: 'per-kpi-performance',
      element: (
        <Protected>
          <PerKPIPerformanceReport />
        </Protected>
      ),
    },
    {
      path: 'ranking',
      element: (
        <Protected>
          <Ranking />
        </Protected>
      ),
    },
    {
      path: 'ranking',
      element: (
        <Protected>
          <Ranking />
        </Protected>
      ),
    },
    {
      path: 'todo',
      element: (
        <Protected>
          <Todo />
        </Protected>
      ),
    },
    {
      path: 'my-team',
      element: (
        <Protected>
          <MyTeam />
        </Protected>
      ),
    },
    {
      path: 'my-team/member/tasks',
      element: (
        <Protected>
          <ViewTeamMemberTasks />
        </Protected>
      ),
    },

    {
      path: 'utils',
      children: [
        {
          path: 'util-color',
          element: (
            <Protected>
              <UtilsColor />
            </Protected>
          ),
        },
      ],
    },
    {
      path: 'utils',
      children: [
        {
          path: 'util-shadow',
          element: (
            <Protected>
              <UtilsShadow />
            </Protected>
          ),
        },
      ],
    },

    {
      path: 'basic-config',
      children: [
        {
          path: 'basic-config-creation',
          element: (
            <Protected>
              <BasicConfigPage />
            </Protected>
          ),
        },
      ],
    },
    {
      path: 'frequencies',
      element: (
        <Protected>
          <Frequencies />
        </Protected>
      ),
    },
    {
      path: 'periods',
      element: (
        <Protected>
          <Periods />
        </Protected>
      ),
    },
    {
      path: 'monitoring-settings',
      element: (
        <Protected>
          <MonitoringSettings />
        </Protected>
      ),
    },
    {
      path: 'measuring-units',
      element: (
        <Protected>
          <MeasuringUnits />
        </Protected>
      ),
    },
    {
      path: 'perspectives',
      element: (
        <Protected>
          <Perspectives />
        </Protected>
      ),
    },

    {
      path: 'performance-rating',
      element: (
        <Protected>
          <PerformanceRating />
        </Protected>
      ),
    },
    {
      path: 'kpi',
      children: [
        {
          path: 'kpi-managment',
          element: (
            <Protected>
              <KPIManagement />
            </Protected>
          ),
        },
      ],
    },

    {
      path: 'Eod',
      element: (
        <Protected>
          <EodActivityPage />
        </Protected>
      ),
    },
    {
      path: 'users',
      element: (
        <Protected>
          <Users />
        </Protected>
      ),
    },
    {
      path: 'users/branch-access/:userId',
      element: (
        <Protected>
          <BranchAccess />
        </Protected>
      ),
    },
    {
      path: 'Patients',
      element: (
        <Protected>
          <Patients />
        </Protected>
      ),
    },

    {
      path: 'role-permission',
      element: (
        <Protected>
          <RolePermission />
        </Protected>
      ),
    },

    {
      path: 'report',
      element: (
        <Protected>
          <Report />
        </Protected>
      ),
    },

    {
      path: '/report/overall_company',
      element: (
        <Protected>
          <Viewoverallcompany />
        </Protected>
      ),
    },

    {
      path: '/report/KpiDetailView',
      element: (
        <Protected>
          <ViewKpiDetail />
        </Protected>
      ),
    },

    {
      path: 'unauthorized',
      element: <Unauthorized />,
    },
    {
      path: 'test',
      element: (
        <Protected>
          <Testpage />
        </Protected>
      ),
    },
    {
      path: 'fortest',
      element: (
        <Protected>
          <Fortest />
        </Protected>
      ),
    },

    {
      path: 'job',
      element: (
        <Protected>
          <Job />
        </Protected>
      ),
    },
    {
      path: '/*',
      element: <NotFound />,
    },
  ],
};

export default MainRoutes;
