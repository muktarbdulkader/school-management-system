import {
  IconHome, IconBook, IconCalendar, IconClipboardList,
  IconBell, IconMessage, IconStar, IconFileText, IconNews, IconBeach,
  IconChecklist
} from '@tabler/icons-react';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

export const getStudentPortalMenu = () => {
  const auth = getRolesAndPermissionsFromToken();
  if (!auth) return null;
  if (!auth.map(r => r.toLowerCase()).includes('student')) return null;

  return {
    id: 'student-portal',
    title: 'Student Portal',
    type: 'group',
    children: [
      { id: 'student-home',         title: 'Dashboard',      type: 'item', url: '/home',           icon: IconHome,          breadcrumbs: false },
      { id: 'student-tasks',        title: 'My Tasks',       type: 'item', url: '/tasks',          icon: IconChecklist,     breadcrumbs: false },
      { id: 'student-subjects',     title: 'My Classes',     type: 'item', url: '/my-subjects',    icon: IconBook,          breadcrumbs: false },
      { id: 'student-assignments',  title: 'Assignments',    type: 'item', url: '/assignments',    icon: IconClipboardList, breadcrumbs: false },
      { id: 'student-schedule',     title: 'Schedule',       type: 'item', url: '/schedule',       icon: IconCalendar,      breadcrumbs: false },
      { id: 'student-announcements',title: 'Announcements',  type: 'item', url: '/announcements',  icon: IconBell,          breadcrumbs: false },
      { id: 'student-messages',     title: 'Messages',       type: 'item', url: '/messages',       icon: IconMessage,       breadcrumbs: false },
      { id: 'student-rate-teachers',title: 'Rate Teachers',  type: 'item', url: '/teacher-ratings',icon: IconStar,          breadcrumbs: false },
      { id: 'student-library',      title: 'Library',        type: 'item', url: '/library',        icon: IconBook,          breadcrumbs: false },
      { id: 'student-leave',        title: 'Leave Requests', type: 'item', url: '/leave-requests', icon: IconFileText,      breadcrumbs: false },
      { id: 'student-blog',         title: 'School Blog',    type: 'item', url: '/blog',           icon: IconNews,          breadcrumbs: false },
    ],
  };
};
