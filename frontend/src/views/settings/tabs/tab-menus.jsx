import { IconHome, IconLayoutKanban, IconReportAnalytics, IconSettings, IconTarget } from '@tabler/icons-react';

const tabSettings = { size: '1.4rem', stroke: '1.6', color: 'white' };
const tabMenus = [
  { id: 'home', title: 'Home', url: '/', icon: <IconHome size={tabSettings.size} stroke={tabSettings.stroke} color={tabSettings.color} /> },
  {
    id: 'employee-tasks',
    title: 'Tasks',
    url: '/todo',
    icon: <IconLayoutKanban size={tabSettings.size} stroke={tabSettings.stroke} color={tabSettings.color} />
  },
  {
    id: 'targets',
    title: 'Target',
    url: '/planning',
    icon: <IconTarget size={tabSettings.size} stroke={tabSettings.stroke} color={tabSettings.color} />
  },
  {
    id: 'report',
    title: 'Reports',
    url: '/report',
    icon: <IconReportAnalytics size={tabSettings.size} stroke={tabSettings.stroke} color={tabSettings.color} />
  },
  // {
  //   id: 'setting',
  //   title: 'Setting',
  //   url: '/settings',
  //   icon: <IconSettings size={tabSettings.size} stroke={tabSettings.stroke} color={tabSettings.color} />
  // }
];

export default tabMenus;
