import React from 'react';
import { IconDoor } from '@tabler/icons-react';

const icons = {
  IconDoor,
};
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

export const messagesTeacher = () => {
  const auth = getRolesAndPermissionsFromToken();

  if (!auth) return null;
  const normalizedAuth = auth.map((role) => role.toLowerCase());

  // auth is an array of role strings
  if (!normalizedAuth.includes('teacher')) return null;

  // Create the icon element properly
  const iconElement = React.createElement(IconDoor, {
    size: 20,
    stroke: 1.5,
  });

  return {
    id: 'messages_teacher',
    title: 'Messages',
    type: 'item',
    url: '/messages_teacher',
    icon: iconElement,
    breadcrumbs: false,
  };
};

// read_room: {
//   id: 'triage_room',
//   title: 'Triage Room',
//   url: '/triage-room',
//   icon: icons.IconDoor,
// },
