import { 
  IconUsers, IconCalendar, IconClipboardList, 
  IconMessage, IconChecklist, IconSchool, IconStar, IconReport
} from '@tabler/icons-react';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

export const getTeacherPortalMenu = () => {
  const auth = getRolesAndPermissionsFromToken();
  if (!auth) return null;
  const roles = auth.map(r => r.toLowerCase());
  if (!roles.includes('teacher')) return null;

  return {
    id: 'teacher-portal',
    title: 'Teacher Portal',
    type: 'group',
    children: [
      { id: 'teacher-home',      title: 'Dashboard',      type: 'item', url: '/home',            icon: IconSchool,        breadcrumbs: false },
      { id: 'teacher-tasks',     title: 'Tasks',          type: 'item', url: '/tasks',           icon: IconChecklist,     breadcrumbs: false },
      { id: 'teacher-classes',   title: 'My Classes',     type: 'item', url: '/classes',         icon: IconUsers,         breadcrumbs: false },
      { id: 'teacher-assignments', title: 'Assessments',  type: 'item', url: '/assignments',     icon: IconClipboardList, breadcrumbs: false },
      { id: 'teacher-reports',   title: 'Performance',    type: 'item', url: '/teacher-reports', icon: IconReport,        breadcrumbs: false },
      { id: 'teacher-messages',  title: 'Messages',       type: 'item', url: '/messages',        icon: IconMessage,       breadcrumbs: false },
    ],
  };
};
