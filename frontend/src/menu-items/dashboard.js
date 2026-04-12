import React from 'react';
import { IconDoor } from '@tabler/icons-react';

const icons = {
  IconDoor,
};
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

export const dashboard = () => {
  const auth = getRolesAndPermissionsFromToken();

  if (!auth) return null;

  const normalizedAuth = auth.map((role) => role.toLowerCase());

  // auth is an array of role strings
  if (!normalizedAuth.includes('parent')) return null;

  // Parent portal menu is handled by parent-portal.js
  // This item is kept for backward compatibility but hidden to avoid duplication
  return null;
};

// read_room: {
//   id: 'triage_room',
//   title: 'Triage Room',
//   url: '/triage-room',
//   icon: icons.IconDoor,
// },
