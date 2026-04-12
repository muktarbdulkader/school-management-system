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
  IconReportAnalytics,
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
  IconReportAnalytics,
};
import getRolesAndPermissionsFromToken from 'utils/auth/getRolesAndPermissionsFromToken';

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const auth = getRolesAndPermissionsFromToken();
export const TeamAndPersonalReports = () => {
  const childrenTemp = [];
  const addedPermissions = new Set();

  const userPermissions = [
    'read:employeetask',
    'read:myteams',
    'read:endofdayactivity',
    'read:my-teams-eod-reports',
    'read:kpitracker',
    'read:approval',
    'read:feedback',
    'read:coaching',
    'read:myfeedbacks',
    'read:monitoringReport',
  ];

  const permissionMap = {
    'read:employeetask': {
      id: 'todos',
      title: 'My Tasks',
      url: '/todo',
      icon: icons.IconList,
    },
    'read:myteams': {
      id: 'teams',
      title: 'My Team Tasks',
      url: '/my-team',
      icon: icons.IconSteam,
    },
    'read:feedback': {
      id: 'Feed Backs',
      title: 'Feed Backs',
      url: '/feedbacks',
      icon: icons.IconCreditCardRefund,
    },
    'read:coaching': {
      id: 'Coaching ',
      title: 'Coaching',
      url: '/coaching',
      icon: icons.IconHeartHandshake,
    },

    'read:endofdayactivity': {
      id: 'EOD Report ',
      title: 'EOD Report',
      url: '/eodreport',
      icon: icons.IconFileAnalytics,
    },

    'read:my-teams-eod-reports': {
      id: 'My Teams EOD Report',
      title: 'My Teams EOD Report',
      url: '/myteamseodreport',
      icon: icons.IconBrandAsana,
    },

    'read:myfeedbacks': {
      id: 'My Feed Backs',
      title: 'My Feed Backs',
      url: '/myfeedbacks',
      icon: icons.IconAlbum,
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
    id: 'TeamAndPersonalReports',
    title: 'Team & Personal Reports',
    icon: icons.IconReportAnalytics,
    type: 'group',
    children: childrenTemp,
  };
};
