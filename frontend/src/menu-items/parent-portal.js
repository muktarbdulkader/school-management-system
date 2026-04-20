import {
  IconHome, IconUser, IconMessage, IconBell, IconCalendar,
  IconBook, IconClipboardList, IconStar, IconFileText, IconNews,
  IconCertificate
} from '@tabler/icons-react';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

export const getParentPortalMenu = () => {
  const auth = getRolesAndPermissionsFromToken();
  if (!auth) return null;
  const roles = auth.map(r => r.toLowerCase());
  if (!roles.includes('parent')) return null;

  return {
    id: 'parent-portal',
    title: 'Parent Portal',
    type: 'group',
    children: [
      { id: 'parent-home', title: 'Dashboard', type: 'item', url: '/home', icon: IconHome, breadcrumbs: false },
      { id: 'parent-messages', title: 'Messages', type: 'item', url: '/messages', icon: IconMessage, breadcrumbs: false },
      { id: 'parent-meetings', title: 'Meetings', type: 'item', url: '/meeting-requests', icon: IconCalendar, breadcrumbs: false },
      { id: 'parent-meeting-hist', title: 'Meeting History', type: 'item', url: '/meeting-history', icon: IconCalendar, breadcrumbs: false },
      { id: 'parent-announcements', title: 'Announcements', type: 'item', url: '/announcements', icon: IconBell, breadcrumbs: false },
      { id: 'parent-assignments', title: 'Assignments', type: 'item', url: '/assignments', icon: IconClipboardList, breadcrumbs: false },
      { id: 'parent-academic-reports', title: 'Academic Reports', type: 'item', url: '/academic-reports/parent', icon: IconCertificate, breadcrumbs: false },
      { id: 'parent-ratings', title: 'Rate Teachers', type: 'item', url: '/teacher-ratings', icon: IconStar, breadcrumbs: false },
      { id: 'parent-leave', title: 'Leave Requests', type: 'item', url: '/leave-requests', icon: IconFileText, breadcrumbs: false },
      { id: 'parent-blog', title: 'School Blog', type: 'item', url: '/blog', icon: IconNews, breadcrumbs: false },
    ],
  };
};
