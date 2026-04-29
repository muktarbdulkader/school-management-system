import {
  IconDashboard, IconUsers, IconSchool, IconBook, IconCalendar,
  IconBell, IconUserCheck, IconShield, IconDownload, IconCoin,
  IconMessage, IconBuildingStore, IconChartBar, IconChecklist,
  IconClock, IconTrendingUp, IconClipboardCheck
} from '@tabler/icons-react';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

const ADMIN_ROLES = ['admin', 'super_admin', 'head_admin', 'ceo', 'hr', 'finance',
  'counselor', 'clinic', 'tlh', 'analyst', 'communication', 'librarian'];
export const getAdminPortalMenu = () => {
  const auth = getRolesAndPermissionsFromToken();
  if (!auth) return null;
  const roles = auth.map(r => r.toLowerCase());
  const isAdmin = roles.some(r => ADMIN_ROLES.includes(r));
  if (!isAdmin) return null;

  const items = [];

  items.push({
    id: 'sms-dashboard',
    title: 'SMS Dashboard',
    type: 'item',
    url: '/home',
    icon: IconDashboard,
    breadcrumbs: false,
  });

  // School Analytics Dashboard - Only for Super Admin
  if (roles.includes('super_admin')) {
    items.push({
      id: 'school-analytics',
      title: 'School Analytics',
      type: 'item',
      url: '/school-analytics',
      icon: IconChartBar,
      breadcrumbs: false,
    });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'tlh', 'counselor', 'clinic', 'analyst'].includes(r))) {
    items.push({ id: 'students', title: 'Students', type: 'item', url: '/students', icon: IconSchool, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'hr', 'tlh', 'analyst'].includes(r))) {
    items.push({ id: 'teachers', title: 'Teachers', type: 'item', url: '/teachers', icon: IconUsers, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'hr', 'tlh', 'analyst'].includes(r))) {
    items.push({ id: 'teacher-performance', title: 'Teacher Performance', type: 'item', url: '/teacher-performance', icon: IconTrendingUp, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'hr'].includes(r))) {
    items.push({ id: 'parents', title: 'Parents', type: 'item', url: '/parents', icon: IconUserCheck, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'tlh'].includes(r))) {
    items.push({ id: 'schedule', title: 'Schedule', type: 'item', url: '/schedule', icon: IconCalendar, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo'].includes(r))) {
    items.push({ id: 'terms', title: 'Term Management', type: 'item', url: '/terms', icon: IconClock, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo'].includes(r))) {
    items.push({ id: 'exams', title: 'Exam Management', type: 'item', url: '/exams', icon: IconClipboardCheck, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'analyst', 'librarian'].includes(r))) {
    items.push({ id: 'library', title: 'Library', type: 'item', url: '/library', icon: IconBook, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'communication', 'counselor', 'clinic'].includes(r))) {
    items.push({ id: 'announcements', title: 'Announcements', type: 'item', url: '/announcements', icon: IconBell, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'finance'].includes(r))) {
    items.push({ id: 'resource-requests', title: 'Resources', type: 'item', url: '/resource-requests', icon: IconBuildingStore, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'analyst', 'finance'].includes(r))) {
    items.push({ id: 'data-export', title: 'Data Export', type: 'item', url: '/data-export', icon: IconDownload, breadcrumbs: false });
  }

  if (roles.some(r => ['admin', 'super_admin', 'head_admin', 'ceo', 'hr'].includes(r))) {
    items.push({ id: 'users-mgmt', title: 'Users', type: 'item', url: '/users', icon: IconShield, breadcrumbs: false });
  }

  items.push({ id: 'task-mgmt', title: 'Tasks', type: 'item', url: '/tasks', icon: IconChecklist, breadcrumbs: false });
  items.push({ id: 'messages-admin', title: 'Messages', type: 'item', url: '/messages', icon: IconMessage, breadcrumbs: false });

  return {
    id: 'admin-portal',
    title: 'Admin Portal',
    type: 'group',
    children: items,
  };
};
