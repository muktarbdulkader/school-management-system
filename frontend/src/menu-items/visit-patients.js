import React from 'react';
import { IconUsersGroup } from '@tabler/icons-react';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

export const visitPatients = () => {
  const auth = getRolesAndPermissionsFromToken();
  console.log('Auth Data:', auth);

  if (!auth) return null;
  const hasPermission = auth.some((role) =>
    role.permissions?.some((per) => per.name === 'read_visit'),
  );

  if (!hasPermission) return null;

  // Create the icon element properly
  const iconElement = React.createElement(IconUsersGroup, {
    size: 20,
    stroke: 1.5,
  });

  return {
    id: 'visit-patients',
    title: 'Patients Visit',
    type: 'item',
    url: '/visit_patients',
    icon: iconElement,
    breadcrumbs: false,
  };
};
