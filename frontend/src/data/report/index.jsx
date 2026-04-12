import { IconCircleCheck, IconLayoutCards, IconList, IconAnalyze, IconTrophy } from '@tabler/icons-react';

export const reportFrequencies = [
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Semi-Annual', value: 'semi_annual' }
];

export const months = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' }
];

export const weeks = [
  { label: 'Week 1', value: '1' },
  { label: 'Week 2', value: '2' },
  { label: 'Week 3', value: '3' },
  { label: 'Week 4', value: '4' }
];

export const weeklyTasks = [
  {
    title: 'Follow-up on New Leads',
    due_date: 'October 2, 2024',
    sub_task_count: 20
  },
  {
    title: 'Weekly Sales Performance Review',
    due_date: 'October 4, 2024',
    sub_task_count: 5
  },
  {
    title: 'Upsell to Existing Customers',
    due_date: 'October 6, 2024',
    sub_task_count: 12
  },
  {
    title: 'Conduct Product Demos',
    due_date: 'October 7, 2024',
    sub_task_count: 8
  },
  {
    title: 'Analyze Customer Feedback',
    due_date: 'October 8, 2024',
    sub_task_count: 7
  }
];

export const weekDayAchievement = [
  { day: 'Monday', achieved: 8, planned: 10 },
  { day: 'Tuesday', achieved: 11, planned: 11 },
  { day: 'Wednesday', achieved: 12, planned: 13 },
  { day: 'Thursday', achieved: 9, planned: 11 },
  { day: 'Friday', achieved: 7, planned: 10 },
  { day: 'Saturday', achieved: 2, planned: 2 }
];

export const leaderboardData = [
  { rank: 1, name: 'Employee Name', tasksCompleted: 5, totalTasks: 5, change: 8, changeType: 'up' },
  { rank: 2, name: 'Employee Name', tasksCompleted: 5, totalTasks: 5, change: -1, changeType: 'down' },
  { rank: 3, name: 'Employee Name', tasksCompleted: 5, totalTasks: 5, change: -1, changeType: 'down' },
  { rank: 4, name: 'Employee Name', tasksCompleted: 5, totalTasks: 5, change: -3, changeType: 'down' },
  { rank: 5, name: 'Employee Name', tasksCompleted: 5, totalTasks: 5, change: 1, changeType: 'up' },
  { rank: 6, name: 'Employee Name', tasksCompleted: 5, totalTasks: 5, change: -3, changeType: 'down' },
  { rank: 7, name: 'Employee Name', tasksCompleted: 5, totalTasks: 5, change: 2, changeType: 'up' },
  { rank: 8, name: 'Employee Name', tasksCompleted: 5, totalTasks: 5, change: 1, changeType: 'up' },
  { rank: 9, name: 'Employee Name', tasksCompleted: 5, totalTasks: 5, change: -3, changeType: 'down' },
  { rank: 10, name: 'Employee Name', tasksCompleted: 5, totalTasks: 5, change: 1, changeType: 'up' }
];

export const exportingFormat = [
  { label: 'Excel Export', value: 'excel' },
  { label: 'PDF Export', value: 'pdf' },
  { label: 'CSV Export', value: 'csv' }
];

export const managerReportTabs = [
  {
    label: 'Unit Report'
  },
  {
    label: 'Personal Report'
  }
];

export const exportingTabs = [
  { icon: <IconLayoutCards size="1rem" />, label: 'Planning', value: 'planning' },
  { icon: <IconAnalyze size="1rem" />, label: 'Monitoring', value: 'monitoring' },
  // { icon: <IconCircleCheck size="1rem" />, label: 'Evaluations', value: 'evaluation' },
  { icon: <IconTrophy size="1rem" />, label: 'Performances', value: 'performance' }
  // { icon: <IconList size="1rem" />, label: 'Tasks', value: 'task' }
];
