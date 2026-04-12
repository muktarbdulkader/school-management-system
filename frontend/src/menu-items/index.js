// import dashboard from './dashboard';
import { getClass } from './getClass';
import { settings } from './settings';
import { Accounts } from './account';
import { dashboard } from './dashboard';
import { TeamAndPersonalReports } from './Team-personal-reports';
import { StatusReport } from './status-reports';
import { visitPatients } from './visit-patients';
import { ratings } from './ratings';
import { RatingStudents } from './rating-students';
import { messagesTeacher } from './messages-teacher';
import { getLeaveRequests } from './leave-requests';
import { getUsers } from './users';
import { getAdminPortalMenu } from './admin-portal';
import { getTeacherPortalMenu } from './teacher-portal';
import { getParentPortalMenu } from './parent-portal';
import { getStudentPortalMenu } from './student-portal';

// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: [
    dashboard(),
    getAdminPortalMenu(),
    getTeacherPortalMenu(),
    getParentPortalMenu(),
    getStudentPortalMenu(),
    Accounts(),
    settings(),
    visitPatients(),
    getUsers(),
    getLeaveRequests(),
  ].filter(Boolean),
};

export default menuItems;
