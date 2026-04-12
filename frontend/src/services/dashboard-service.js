// Mock data - replace with actual API calls
import GetToken from 'utils/auth-token';

export const mockDashboardData = {
  student: {
    name: "Yohanes Alemu",
    grade: "Grade 8",
    section: "5",
  },
  urgentNotice: {
    title: "Urgent Notice",
    message: "Parent-Teacher Conference scheduled for next week. Please confirm your attendance.",
    type: "warning",
  },
  todaysClasses: [
    {
      id: "1",
      subject: "Science",
      time: "7:00 AM - 8:45 AM",
      teacher: "Mr. Melaku",
      status: "Completed",
      progress: 100,
      color: "#4caf50",
    },
    {
      id: "2",
      subject: "Mathematics",
      time: "9:00 AM - 9:45 AM",
      teacher: "Mr. Gashaw",
      status: "In Progress",
      progress: 75,
      color: "#2196f3",
    },
    {
      id: "3",
      subject: "English",
      time: "10:00 AM - 10:45 AM",
      teacher: "Mrs. Senayit",
      status: "Upcoming",
      progress: 0,
      color: "#9e9e9e",
    },
    {
      id: "4",
      subject: "History",
      time: "11:00 AM - 11:45 AM",
      teacher: "Mr. Johnson",
      status: "Upcoming",
      progress: 0,
      color: "#9e9e9e",
    },
  ],
  upcomingAssignments: [
    {
      id: "1",
      subject: "Math",
      title: "Quadratic Equations",
      dueDate: "Due Tomorrow",
      status: "Pending",
      icon: "36",
      color: "#2196f3",
    },
    {
      id: "2",
      subject: "English",
      title: "Essay Draft",
      dueDate: "Due in 3 days",
      status: "Pending",
      icon: "📝",
      color: "#9c27b0",
    },
  ],
  upcomingActivities: [
    {
      id: "1",
      title: "Life Contingency Tutorials",
      date: "8th - 10th July 2021",
      time: "8 AM - 9 AM",
      location: "Edulog Tutorial College, Blk 56, Lagos State",
      day: "8",
      color: "#2196f3",
    },
    {
      id: "2",
      title: "Social Insurance Test",
      date: "13th July 2021",
      time: "8 AM - 9 AM",
      location: "School Hall, University Road, Lagos State",
      day: "13",
      color: "#e91e63",
    },
    {
      id: "3",
      title: "Adv. Maths Assignment Due",
      date: "18th July 2021",
      time: "8 AM - 9 AM",
      note: "**To be submitted via Email",
      day: "18",
      color: "#4caf50",
    },
    {
      id: "4",
      title: "Dr. Dipo's Tutorial Class",
      date: "23rd July 2021",
      time: "10 AM - 1 PM",
      location: "Edulog Tutorial College, Blk 56, Lagos State",
      day: "23",
      color: "#ff5722",
    },
  ],
  progressMetrics: [
    {
      label: "Attendance",
      percentage: 92,
      color: "#4caf50",
    },
    {
      label: "Academic",
      percentage: 88,
      color: "#2196f3",
    },
    {
      label: "Behavior",
      percentage: 95,
      color: "#9c27b0",
    },
    {
      label: "Participation",
      percentage: 85,
      color: "#ff9800",
    },
    {
      label: "Homework",
      percentage: 78,
      color: "#f44336",
    },
    {
      label: "Projects",
      percentage: 91,
      color: "#00bcd4",
    },
  ],
  calendar: {
    month: "JULY",
    year: 2021,
    weeks: [
      [null, null, null, 1, 2, 3, 4],
      [5, 6, 7, 8, 9, 10, 11],
      [12, 13, 14, 15, 16, 17, 18],
      [19, 20, 21, 22, 23, 24, 25],
      [26, 27, 28, 29, 30, 31, null],
    ],
    specialDates: {
      8: { color: "#2196f3", type: "current", title: "Today" },
      13: { color: "#e91e63", type: "event", title: "Social Insurance Test" },
      18: { color: "#4caf50", type: "event", title: "Assignment Due" },
      23: { color: "#ff5722", type: "event", title: "Tutorial Class" },
    },
  },
}

// Fetch actual dashboard data from API
export async function fetchDashboardData(studentId = null) {
  try {
    // Get authentication token
    const token = await GetToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Construct API URL - if no studentId, get general parent dashboard
    const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const apiUrl = studentId
      ? `${API}/api/parent/dashboard/${studentId}/`
      : `${API}/api/parent/dashboard/`;

    console.log('Fetching dashboard data from:', apiUrl);

    // Fetch dashboard data from backend
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch dashboard data');
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

export async function updateClassProgress(classId, progress) {
  // Simulate API call to update class progress
  await new Promise((resolve) => setTimeout(resolve, 500))
  console.log(`Updated class ${classId} progress to ${progress}%`)
}

export async function markAssignmentComplete(assignmentId) {
  // Simulate API call to mark assignment as complete
  await new Promise((resolve) => setTimeout(resolve, 500))
  console.log(`Marked assignment ${assignmentId} as complete`)
}
