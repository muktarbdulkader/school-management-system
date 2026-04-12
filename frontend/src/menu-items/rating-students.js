import React from 'react';
import { IconMessageStar } from '@tabler/icons-react';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

export const RatingStudents = () => {
  const auth = getRolesAndPermissionsFromToken();

  if (!auth) return null;
  const normalizedAuth = auth.map((role) => role.toLowerCase());

  // auth is an array of role strings
  if (!normalizedAuth.includes('teacher')) return null;

  const iconElement = React.createElement(IconMessageStar, {
    size: 20,
    stroke: 1.5,
  });

  return {
    id: 'rating-students',
    title: 'Ratings',
    type: 'item',
    url: '/RatingStudents',
    icon: iconElement,
    breadcrumbs: false,
  };
};
