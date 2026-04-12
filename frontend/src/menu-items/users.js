import React from 'react';
import { IconUser } from '@tabler/icons-react';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

export const getUsers = () => {
  const auth = getRolesAndPermissionsFromToken();

  if (!auth) return null;
  const normalizedAuth = auth.map((role) => role.toLowerCase());

  // auth is an array of role strings
  if (!normalizedAuth.includes('admin')) return null;

  const iconElement = React.createElement(IconUser, {
    size: 20,
    stroke: 1.5,
  });

  return {
    id: 'users',
    title: 'Users',
    type: 'item',
    url: '/users',
    icon: iconElement,
    breadcrumbs: false,
  };
};
