import React from 'react';
import { IconSchool } from '@tabler/icons-react';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

export const getClass = () => {
  const auth = getRolesAndPermissionsFromToken();

  if (!auth) return null;
  const normalizedAuth = auth.map((role) => role.toLowerCase());

  // auth is an array of role strings
  if (!normalizedAuth.includes('teacher')) return null;

  const iconElement = React.createElement(IconSchool, {
    size: 20,
    stroke: 1.5,
  });

  return {
    id: 'class',
    title: 'Class',
    type: 'item',
    url: '/classes',
    icon: iconElement,
    breadcrumbs: false,
  };
};
