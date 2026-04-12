import React from 'react';
import { IconCalendarX } from "@tabler/icons-react";
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

export const getLeaveRequests = () => {
  const auth = getRolesAndPermissionsFromToken();

  if (!auth) return null;
  const normalizedAuth = auth.map((role) => role.toLowerCase());

  // Show leave requests for students, teachers, and parents
  const allowedRoles = ['student', 'teacher', 'parent'];
  const hasAccess = normalizedAuth.some(role => allowedRoles.includes(role));
  
  if (!hasAccess) return null;

  const iconElement = React.createElement(IconCalendarX, {
    size: 20,
    stroke: 1.5,
  });

  return {
    id: 'leave-requests',
    title: 'Leave Requests',
    type: 'item',
    url: '/leave-requests',
    icon: iconElement,
    breadcrumbs: false,
  };
};
