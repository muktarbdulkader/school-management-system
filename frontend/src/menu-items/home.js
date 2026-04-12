// assets
import {
  IconHome,
  IconHome2,
  IconDashboard,
  IconLayoutDashboard,
} from '@tabler/icons-react';

// constant
const icons = {
  IconHome,
  IconHome2,
  IconDashboard,
  IconLayoutDashboard,
};

import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

// ==============================|| HOME MENU ITEM ||============================== //
const auth = getRolesAndPermissionsFromToken();

export const home = () => {
  let childrenTemp = [];

  childrenTemp.push({
    id: 'default',
    title: 'Dashboard',
    type: 'item',
    url: '/',
    icon: icons.IconDashboard,
    breadcrumbs: false,
  });

  return {
    id: 'home',
    title: 'Dashboard',
    type: 'group',
    url: '/',
    icon: icons.IconLayoutDashboard,
    children: [...childrenTemp],
  };
};
