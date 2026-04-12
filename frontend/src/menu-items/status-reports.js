import {
  IconHome,
  IconGauge,
  IconLayoutCards,
  IconTrophy,
  IconZoomScan,
  IconCircleCheck,
  IconListCheck,
  IconHazeMoon,
  IconList,
  IconChartInfographic,
  IconKey,
  IconAnalyze,
  IconSteam,
  IconCircle,
  IconFocus2,
  IconCreditCardRefund,
  IconAlbum,
  IconDeviceCctv,
  IconHeartHandshake,
  IconFileSymlink,
  IconFileAnalytics,
  IconBrandAsana,
  IconDeviceDesktopAnalytics,
  IconChartBar,
} from '@tabler/icons-react';

const icons = {
  IconHome,
  IconGauge,
  IconLayoutCards,
  IconTrophy,
  IconZoomScan,
  IconCircleCheck,
  IconListCheck,
  IconHazeMoon,
  IconList,
  IconChartInfographic,
  IconKey,
  IconAnalyze,
  IconSteam,
  IconCircle,
  IconFocus2,
  IconCreditCardRefund,
  IconAlbum,
  IconDeviceCctv,
  IconHeartHandshake,
  IconFileSymlink,
  IconFileAnalytics,
  IconBrandAsana,
  IconDeviceDesktopAnalytics,
  IconChartBar,
};
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const auth = getRolesAndPermissionsFromToken();
export const StatusReport = () => {
  const childrenTemp = [];
  const addedPermissions = new Set();

  const userPermissions = [
    'read:plan_status',
    'read:task_status',
    'read:monitor-status',
  ];

  const permissionMap = {
    'read:plan_status': {
      id: 'planning-status',
      title: 'Planning Status',
      url: '/planning/status',
      icon: icons.IconCircle,
    },

    'read:task_status': {
      id: 'task-status',
      title: 'Task Status',
      url: '/task/status',
      icon: icons.IconFocus2,
    },

    'read:monitor-status': {
      id: 'monitoringStatus',
      title: 'Monitoring Status',
      url: '/monitoringReport',
      icon: icons.IconDeviceDesktopAnalytics,
    },
  };

  if (auth) {
    userPermissions.forEach((permissionName) => {
      auth.forEach((role) => {
        const setting =
          permissionMap[permissionName] ||
          permissionMap[`${permissionName}-approvals`];

        if (setting && !addedPermissions.has(setting.id)) {
          const hasPermission = role.permissions?.find(
            (per) => per.name === permissionName,
          );

          if (hasPermission) {
            childrenTemp.push({
              ...setting,
              type: 'item',
            });
            addedPermissions.add(setting.id);
          }
        }
      });
    });
  }

  return {
    id: 'status report',
    title: 'Status Report',
    icon: icons.IconChartBar,
    type: 'group',
    children: childrenTemp,
  };
};
