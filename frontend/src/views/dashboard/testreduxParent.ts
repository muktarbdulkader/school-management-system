import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Warning, CalendarToday, Close } from '@mui/icons-material';
import { createTheme } from '@mui/material/styles';

import TodaysClasses from './components/parent-dashboard/todays-classes';
import UpcomingAssignments from './components/parent-dashboard/upcoming-assignments';
import BehavioralAndAcademicProgress from './components/parent-dashboard/behavioral-and-academic-progress';
import CalendarAndEvents from './components/parent-dashboard/calendar-and-events';
import UpcomingActivities from './components/parent-dashboard/upcoming-activities';
import {
  fetchDashboardData,
  markAssignmentComplete,
} from 'services/dashboard-service';
import { useNavigate } from 'react-router-dom';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import GetToken from 'utils/auth-token';
import StudentDropdown from './studentsComponets/StudentDropdown';
import Health from './components/parent-dashboard/Health';
import { useDispatch, useSelector } from 'react-redux';
import { setStudents, setActiveStudent } from 'store/slices/active-student';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff4081',
    },
  },
});

export default function ParentDashboard() {
  const dispatch = useDispatch();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [behavioralAndAcademic, setBehavioralAndAcademic] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [classSchedule, setClassSchedule] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [calendarData, setCalendarData] = useState({
    month: '',
    year: '',
    weeks: [],
    specialDates: {},
  });
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);

  // const [students, setStudents] = useState([]);
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const { students = [], activeStudentId = '' } = useSelector(
    (state) => state.studentsSlice || {},
  );

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    if (activeStudentId) {
      setSelectedStudentId(activeStudentId);
    }
  }, [activeStudentId]);

  useEffect(() => {
    if (selectedStudentId) {
      loadDashboardData(selectedStudentId);
      // Update active student in Redux store
      dispatch(setActiveStudent(selectedStudentId));
    }
  }, [selectedStudentId, dispatch]);

  useEffect(() => {
    fetchStudents();
    fetchAAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length > 0) {
      const firstEventDate = new Date(announcements[0].event_date);
      const month = firstEventDate.toLocaleString('en-US', { month: 'long' });
      const year = firstEventDate.getFullYear();

      const date = new Date(year, firstEventDate.getMonth(), 1);
      const weeks = [];
      let week = [];

      // Fill empty slots before the first day of the month
      for (let i = 0; i < (date.getDay() + 6) % 7; i++) {
        week.push(null);
      }

      while (date.getMonth() === firstEventDate.getMonth()) {
        week.push(date.getDate());

        if (week.length === 7) {
          weeks.push(week);
          week = [];
        }

        date.setDate(date.getDate() + 1);
      }

      if (week.length > 0) {
        while (week.length < 7) week.push(null);
        weeks.push(week);
      }

      // Build specialDates from announcements
      const specialDates = {};
      announcements.forEach((ann) => {
        const d = new Date(ann.event_date).getDate();
        specialDates[d] = {
          color:
            ann.urgency?.toUpperCase() === 'HIGH'
              ? '#f44336'
              : ann.urgency?.toUpperCase() === 'MEDIUM'
                ? '#ffeb3b'
                : '#2196f3',
          title: ann.title,
        };
      });

      setCalendarData({
        month,
        year,
        weeks,
        specialDates,
      });
    }
  }, [announcements]);

  const handleStudentChange = (event) => {
    const studentId = event.target.value;
    setSelectedStudentId(studentId);
    loadDashboardData(studentId);
  };

  const loadDashboardData = async (studentId) => {
    try {
      setLoading(true);
      const data = await fetchDashboardData(studentId);
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = async (classItem) => {
    console.log('Class clicked:', classItem);
  };

  const handleAssignmentClick = async (assignment) => {
    console.log('Assignment clicked:', assignment);
    try {
      await markAssignmentComplete(assignment.id);
      await loadDashboardData(selectedStudentId); // Pass the selected student ID
    } catch (err) {
      console.error('Error updating assignment:', err);
    }
  };

  const handleActivityClick = (activity) => {
    console.log('Activity clicked:', activity);
  };

  const handleMetricClick = (metric) => {
    console.log('Metric clicked:', metric);
  };

  const handleDateClick = (date) => {
    console.log('Date clicked:', date);
  };

  const handleMonthChange = (month, year) => {
    console.log('Month changed:', month, year);
  };

  const fetchStudents = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.parentStudents}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch students');
      }

      if (responseData.success) {
        // Store students in Redux instead of local state
        dispatch(setStudents(responseData.data));

        // Set the first student as selected by default if available
        // Only set if we don't already have a selected student
        if (responseData.data.length > 0 && !selectedStudentId) {
          const firstStudentId = responseData.data[0].id;
          setSelectedStudentId(firstStudentId);
          dispatch(setActiveStudent(firstStudentId));
        }

        setPagination({
          ...pagination,
          last_page: responseData.last_page || 1,
          total: responseData.total || responseData.data.length,
        });
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (selectedStudentData) => {
    if (!selectedStudentData?.student_details?.id) return;

    if (selectedStudentData.schedule) {
      setClassSchedule(selectedStudentData.schedule);
    }
    if (selectedStudentData.upcoming_assignments) {
      setUpcomingAssignments(selectedStudentData.upcoming_assignments);
    }

    if (selectedStudentData.health) {
      setHealthData(selectedStudentData.health);
    }

    if (
      selectedStudentData.behavior_ratings &&
      selectedStudentData.attendance
    ) {
      const ratingsArray = [];

      if (selectedStudentData.behavior_ratings) {
        ratingsArray.push({
          percentage: selectedStudentData.behavior_ratings.average_rating || 0,
          color: '#2196f3',
          label: 'Behavior Rating',
        });
      }
      if (selectedStudentData.attendance) {
        ratingsArray.push({
          percentage: selectedStudentData.attendance.average_attendance || 0,
          color: '#22C55E',
          label: 'Average Attendance',
        });
      }

      setBehavioralAndAcademic(ratingsArray);
    }
  };

  const fetchAAnnouncements = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.Announcements}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch students');
      }

      if (responseData.success) {
        setAnnouncements(responseData.data);

        setPagination({
          ...pagination,
          last_page: responseData.last_page || 1,
          total: responseData.total || responseData.data.length,
        });
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendarDrawer = () => {
    setCalendarDrawerOpen(!calendarDrawerOpen);
  };

  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          py: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (error || !dashboardData) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography color="error" variant="h6" textAlign="center">
          {error || 'No data available'}
        </Typography>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button onClick={loadDashboardData} variant="contained">
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box>
      <Container
        maxWidth="xl"
        sx={{
          py: 3,
          bgcolor: '#f5f5f5',
          minHeight: '100vh',
          borderRadius: 2,
        }}
      >
        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
              <StudentDropdown
                key={students.length}
                students={students}
                selectedStudentId={selectedStudentId}
                handleStudentChange={handleStudentChange}
                onStudentSelect={handleStudentSelect}
                sx={{ maxWidth: 230 }}
              />
              {/* Calendar Button for Mobile at the Top */}
              {isMobile && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={toggleCalendarDrawer}
                    startIcon={<CalendarToday />}
                    sx={{
                      borderRadius: '8px',
                      py: 1,
                      px: 3,
                      width: '100%',
                      maxWidth: 300,
                    }}
                  >
                    Calendar & Events
                  </Button>
                </Box>
              )}
            </Box>

            {/* Urgent Notice */}
            {dashboardData.urgentNotice && (
              <Card
                sx={{
                  mb: 3,
                  border: '2px solid #ffcdd2',
                  backgroundColor: '#fce4ec',
                }}
              >
                <CardContent>
                  <Box
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}
                  >
                    <Warning sx={{ color: '#f44336', mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                        {dashboardData.urgentNotice.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {dashboardData.urgentNotice.message}
                      </Typography>
                      <Button variant="contained" size="small">
                        View Details
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
            <Box sx={{ mb: 3 }}>
              <TodaysClasses
                classes={classSchedule} // This should be the schedule array from your API
                onClassClick={handleClassClick}
                loading={loading}
                error={error}
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <Health healthData={healthData} />
            </Box>
            <Box sx={{ mb: 3 }}>
              <UpcomingAssignments
                assignments={upcomingAssignments}
                onAssignmentClick={handleAssignmentClick}
                onViewAll={() => console.log('View all assignments')}
              />
            </Box>
            <Box>
              <BehavioralAndAcademicProgress
                metrics={behavioralAndAcademic}
                onMetricClick={handleMetricClick}
                loading={loading}
                error={error}
              />
            </Box>
          </Grid>

          {/* Right Column - Hidden on mobile, shown in drawer */}
          {!isMobile ? (
            <Grid item xs={12} lg={4}>
              <Box sx={{ mb: 3 }}>
                <CalendarAndEvents
                  calendar={calendarData}
                  onDateClick={handleDateClick}
                  onMonthChange={handleMonthChange}
                />
              </Box>
              <Box>
                <UpcomingActivities
                  activities={announcements}
                  onActivityClick={handleActivityClick}
                  onSeeAll={() => console.log('See all activities')}
                />
              </Box>
            </Grid>
          ) : (
            <Drawer
              anchor="right"
              open={calendarDrawerOpen}
              onClose={toggleCalendarDrawer}
              sx={{
                '& .MuiDrawer-paper': {
                  width: '85%',
                  maxWidth: 400,
                  p: 2,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h3">Calendar & Events</Typography>
                <IconButton onClick={toggleCalendarDrawer}>
                  <Close />
                </IconButton>
              </Box>
              <Box sx={{ mb: 3 }}>
                <CalendarAndEvents
                  calendar={calendarData}
                  onDateClick={handleDateClick}
                  onMonthChange={handleMonthChange}
                />
              </Box>
              <Box>
                <UpcomingActivities
                  activities={announcements}
                  onActivityClick={handleActivityClick}
                  onSeeAll={() => console.log('See all activities')}
                />
              </Box>
            </Drawer>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
