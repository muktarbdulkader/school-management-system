// assets
import { IconDeviceIpadHorizontalX } from '@tabler/icons-react';
import { IconKey, IconUserCog } from '@tabler/icons-react';
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

// constant
const icons = {
  IconKey,
  IconUserCog,
  IconDeviceIpadHorizontalX,
};

// ==============================|| USER MANAGEMENT MENU ITEMS ||============================== //
const auth = getRolesAndPermissionsFromToken();

export const Accounts = () => {
  const childrenTemp = [];
  const addedPermissions = new Set();

  const orderedPermissions = [
    'read_role',
    'read_permission',
    'read_user',
    'read_employees_plan_remove',
  ];

  const permissionMap = {
    read_role: {
      id: 'role',
      title: 'Role and Permission',
      icon: icons.IconKey,
      url: '/role-permission',
    },
    read_permission: {
      id: 'role',
      title: 'Role and Permission',
      icon: icons.IconKey,
      url: '/role-permission',
    },
    read_user: {
      id: 'users',
      title: 'Users',
      requiredRole: 'Admin',
      icon: icons.IconUserCog,
      url: '/users',
    },
    read_employees_plan_remove: {
      id: 'employees_plan_remove',
      title: 'Plan Remove',
      icon: icons.IconDeviceIpadHorizontalX,
      url: '/employees_plan_remove',
    },
  };

  if (auth) {

    orderedPermissions.forEach((permissionName) => {
      auth.forEach((role) => {
        const setting = permissionMap[permissionName];

        if (setting && !addedPermissions.has(permissionName)) {
          const hasPermission = role.permissions?.find(
            (per) => per.name === permissionName,
          );

          if (hasPermission) {
            childrenTemp.push({
              ...setting,
              type: 'item',
            });
            addedPermissions.add(permissionName);
          }
        }
      });
    });
  }

  return {
    id: 'account',
    title: 'Account',
    type: 'group',
    icon: icons.IconUserCog,
    children: childrenTemp,
  };
};
