import { useState, useEffect, use } from 'react';
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
  Alert,
  Avatar,
  Rating,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { Warning, CalendarToday, Close, Star } from '@mui/icons-material';
import { createTheme } from '@mui/material/styles';

import TodaysClasses from './components/parent-dashboard/todays-classes';
import UpcomingAssignments from './components/parent-dashboard/upcoming-assignments';
import BehavioralAndAcademicProgress from './components/parent-dashboard/behavioral-and-academic-progress';
import CalendarAndEvents from './components/parent-dashboard/calendar-and-events';
import UpcomingActivities from './components/parent-dashboard/upcoming-activities';
import QuickActions from './components/parent-dashboard/QuickActions';
import DailyLessonPlans from './components/common/lesson-plans';
import ExamsAndResults from './components/common/exams-results';
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
import {
  setRelationshipId,
  setStudentData,
  setStudentId,
} from 'store/slices/active-student';
import AnnouncementDetailsModal from './components/techer-dashoard/components/AnnouncementDetailsModal';

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

const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const filterByCalendarDay = (list, dayInfo) => {
  if (!list || !dayInfo) return [];

  const { day, calendarMonth, calendarYear } = dayInfo;

  try {
    // Convert month name to index (0 = Jan, 11 = Dec)
    const monthIndex = new Date(
      `${calendarMonth} 1, ${calendarYear}`,
    ).getMonth();

    // Construct the date using local time (avoids timezone shifts)
    const targetDate = new Date(calendarYear, monthIndex, day);
    targetDate.setDate(targetDate.getDate() + 1);

    // Format as YYYY-MM-DD in local timezone
    const targetDateString = targetDate.toISOString().split('T')[0];

    return list.filter((item) => {
      if (!item.event_date) return false;

      try {
        const itemDate = new Date(item.event_date);
        if (isNaN(itemDate.getTime())) return false;

        const itemDateString = itemDate.toISOString().split('T')[0];
        return itemDateString === targetDateString;
      } catch {
        return false;
      }
    });
  } catch (error) {
    console.error('Error filtering by calendar day:', error);
    return [];
  }
};

export default function ParentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [selectedStudentId, setSelectedStudentId] = useState('');
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [behavioralAndAcademic, setBehavioralAndAcademic] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [classSchedule, setClassSchedule] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [exams, setExams] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [assignmentGrades, setAssignmentGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementDetails, setAnnouncementDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState(null);
  const [urgentAnnouncements, setUrgentAnnouncements] = useState([]);
  const [filterDayAnnouncements, setFilterDayAnnouncements] = useState([]);
  const [calendarData, setCalendarData] = useState({
    month: '',
    year: '',
    weeks: [],
    specialDates: {},
  });
  // current month/year controlled by state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);
  const [students, setStudents] = useState([]);
  // Teacher rating state
  const [teachers, setTeachers] = useState([]);
  const [ratingDialog, setRatingDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingCategory, setRatingCategory] = useState('overall');
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const dispatch = useDispatch();
  const studentId = useSelector((state) => state.student.studentId);
  const relationshipId = useSelector((state) => state.student.relationshipId);
  const studentData = useSelector((state) => state.student.studentData);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    // Load general dashboard data first to get available students
    // Only run on mount - not when studentId changes to avoid infinite loop
    loadDashboardData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchAAnnouncements();
    fetchAAnnouncementsUrgent();
    fetchNotifications();
    fetchTeachersForRating();
  }, []);
  // build calendar grid and specialDates (array per day)
  useEffect(() => {
    // build month grid for currentMonth/currentYear
    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    const monthName = firstOfMonth.toLocaleString('en-US', { month: 'long' });

    const weeks = [];
    let week = [];

    // add empty slots before first day (Monday-first)
    const startBlankCount = (firstOfMonth.getDay() + 6) % 7;
    for (let i = 0; i < startBlankCount; i++) week.push(null);

    const iterDate = new Date(currentYear, currentMonth, 1);
    while (iterDate.getMonth() === currentMonth) {
      week.push(iterDate.getDate());
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
      iterDate.setDate(iterDate.getDate() + 1);
    }

    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    // collect events for the month into arrays keyed by day number
    const specialDates = {};
    announcements.forEach((ann) => {
      if (!ann.event_date) return;
      const annDate = new Date(ann.event_date);
      if (
        annDate.getMonth() === currentMonth &&
        annDate.getFullYear() === currentYear
      ) {
        const d = annDate.getDate();
        if (!specialDates[d]) specialDates[d] = [];
        specialDates[d].push({
          id: ann.id,
          color:
            ann.urgency?.toUpperCase() === 'HIGH'
              ? '#f44336'
              : ann.urgency?.toUpperCase() === 'MEDIUM'
                ? '#ffeb3b'
                : '#2196f3',
          title: ann.title,
          raw: ann,
        });
      }
    });

    setCalendarData({
      month: monthName,
      year: currentYear,
      weeks,
      specialDates,
    });
  }, [announcements, currentMonth, currentYear]);

  useEffect(() => {
    setFilterDayAnnouncements(announcements);
  }, [announcements]);

  // Update local state when studentData in Redux changes for behavioral and academic progress
  useEffect(() => {
    if (studentData) {
      // Extract and set data from Redux store 
      if (studentData.schedule) {
        console.log('Student Schedule:', studentData.schedule);
        setClassSchedule(studentData.schedule);
      }
      if (studentData.upcoming_assignments) {
        setUpcomingAssignments(studentData.upcoming_assignments);
      }
      if (studentData.lesson_plans) {
        setLessonPlans(studentData.lesson_plans);
      }
      if (studentData.exams) {
        setExams(studentData.exams);
      }
      if (studentData.exam_results) {
        setExamResults(studentData.exam_results);
      }
      if (studentData.assignment_grades) {
        setAssignmentGrades(studentData.assignment_grades);
      }
      if (studentData.teachers) {
        setTeachers((studentData.teachers || []).slice(0, 6));
      }
      if (studentData.health) {
        setHealthData(studentData.health);
      }
      if (studentData.behavior_ratings || studentData.attendance) {
        const ratingsArray = [];
        console.log('Student Data in useEffect:', studentData);

        // Process behavior ratings by category
        if (studentData.behavior_ratings) {
          Object.entries(studentData.behavior_ratings).forEach(
            ([label, value]) => {
              ratingsArray.push({
                percentage: value?.average || 0,
                color: label.toLowerCase().includes('overall')
                  ? '#2196f3'
                  : '#3b82f6', // highlight overall
                label,
              });
            },
          );
        }

        // Add attendance as a separate metric
        if (studentData.attendance) {
          ratingsArray.push({
            percentage: studentData.attendance.average_attendance || 0,
            color: '#22C55E',
            label: 'Average Attendance',
          });
        }

        setBehavioralAndAcademic(ratingsArray);
      }
    }
  }, [studentData]);

  // const handleStudentChange = (event) => {
  //   const studentId = event.target.value;
  //   setSelectedStudentId(studentId);
  //   loadDashboardData(studentId);
  // };

  const handleStudentChange = (event) => {
    const relationshipId = event.target.value;
    const selectedStudent = students.find((s) => s.id === relationshipId);

    if (selectedStudent && selectedStudent.student_details) {
      dispatch(setRelationshipId(relationshipId)); // Store relationship ID
      dispatch(setStudentId(selectedStudent.student_details.id)); // Store student ID

      // Immediately load dashboard data for the selected student
      loadDashboardData(selectedStudent.student_details.id);
    }
  };

  const loadDashboardData = async (studentId) => {
    try {
      setLoading(true);
      setError(null);

      // If no studentId provided, fetch general dashboard to get available students
      if (!studentId) {
        const generalData = await fetchDashboardData(null);
        console.log('General Dashboard Data:', generalData);

        // If students are available, use the first one
        if (generalData.all_students && generalData.all_students.length > 0) {
          studentId = generalData.all_students[0].id;
          console.log('Using first available student:', studentId);
          // Update Redux with the selected student
          dispatch(setStudentId(studentId));
        } else {
          // No students linked - set empty state but don't show error
          setDashboardData(generalData);
          setLoading(false);
          return;
        }
      }

      // Fetch specific student dashboard data
      const data = await fetchDashboardData(studentId);
      console.log('Dashboard Data:', data);
      setDashboardData(data);

      // Store the data in Redux
      dispatch(setStudentData(data));
    } catch (err) {
      const errorMessage = err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Error loading dashboard:', err);
      toast.error(errorMessage);
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
      await loadDashboardData(studentId);
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

  const handleDateClick = async (events) => {
    if (!events || !events.day) {
      // reset to all announcements
      setFilterDayAnnouncements(announcements);
      return;
    }
    setFilterDayAnnouncements(filterByCalendarDay(announcements, events));
  };

  const handleMonthChange = (monthIndex, year) => {
    console.log('Month changed:', monthIndex, year);
    setCurrentMonth(monthIndex);
    setCurrentYear(year);
  };

  const fetchTeachersForRating = async () => {
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.teachers}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers((data.data || data.results || []).slice(0, 6));
      }
    } catch { /* silent */ }
  };

  const openTeacherRating = (teacher) => {
    setSelectedTeacher(teacher);
    setRatingValue(0);
    setRatingCategory('overall');
    setRatingComment('');
    setRatingDialog(true);
  };

  const submitTeacherRating = async () => {
    if (!ratingValue) { toast.warning('Please select a rating'); return; }
    setSubmittingRating(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.teacherRatings}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher: selectedTeacher.id,
          rating: ratingValue,
          category: ratingCategory,
          comment: ratingComment,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.success || res.status === 201)) {
        toast.success('Rating submitted');
        setRatingDialog(false);
        fetchTeachersForRating();
      } else {
        toast.error(data.message || 'Failed to submit rating');
      }
    } catch { toast.error('Error submitting rating'); }
    finally { setSubmittingRating(false); }
  };

  const fetchStudents = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.api}${Backend.parentStudents}children/`;
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
        setStudents(responseData.data);
        // Set the first student as selected by default if available
        if (responseData.data.length > 0 && !studentId) {
          const firstStudent = responseData.data[0];
          dispatch(setRelationshipId(firstStudent.id));
          dispatch(setStudentId(firstStudent.student_details.id));
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



  const fetchAAnnouncements = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.api}${Backend.announcements}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();
      console.log('Announcements response:', responseData);
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch announcements');
      }

      if (responseData.success) {
        setAnnouncements(responseData.data || responseData.results || []);

        setPagination({
          ...pagination,
          last_page: responseData.last_page || 1,
          total: responseData.total || (responseData.data || responseData.results || []).length,
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

  const fetchAnnouncementDetails = async (announcementId) => {
    setModalLoading(true);
    const token = await GetToken();
    const Api = `${Backend.api}${Backend.announcements}${announcementId}/`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || 'Failed to fetch announcement details',
        );
      }

      if (responseData.success) {
        setAnnouncementDetails(responseData.data);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewDetails = async (announcementId) => {
    setSelectedAnnouncementId(announcementId);
    setAnnouncementModalOpen(true);

    // Only fetch details if we don't have them or if it's a different announcement
    if (!announcementDetails || announcementDetails.id !== announcementId) {
      await fetchAnnouncementDetails(announcementId);
    }
  };

  const handleCloseModal = () => {
    setAnnouncementModalOpen(false);
    // Optionally keep the data for faster reopening, or clear it:
    // setAnnouncementDetails(null);
  };

  const fetchAAnnouncementsUrgent = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.api}${Backend.announcementsUrgent}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch urgent announcements');
      }

      if (responseData.success) {
        setUrgentAnnouncements(responseData.data || responseData.results || []);

        setPagination({
          ...pagination,
          last_page: responseData.last_page || 1,
          total: responseData.total || (responseData.data || responseData.results || []).length,
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

  const fetchNotifications = async () => {
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.communicationNotifications}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const responseData = await res.json();
        const data = responseData.results || responseData.data || responseData;
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const token = await GetToken();
      await fetch(`${Backend.api}${Backend.communicationNotifications}${id}/mark_as_read/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
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

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Unable to load dashboard data. Please try again.
          </Typography>
          <Button onClick={() => loadDashboardData(studentId)} variant="contained">
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
                students={students}
                selectedStudentId={relationshipId}
                handleStudentChange={handleStudentChange}
                onStudentSelect={() => { }}
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
            {[...urgentAnnouncements, ...notifications.filter(n => n.urgency === 'HIGH' && !n.is_read)].map((item) => (
              <Card
                key={item.id}
                sx={{
                  mb: 3,
                  border: '2px solid #ffcdd2',
                  backgroundColor: item.urgency === 'HIGH' ? '#fff5f5' : '#fce4ec',
                }}
              >
                <CardContent>
                  <Box
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}
                  >
                    <Warning sx={{ color: '#f44336', mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ mb: 0.5, color: '#b71c1c' }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ mb: 2, color: 'text.secondary' }}
                      >
                        {truncateText(item.message, 255)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                        <Chip label={item.urgency} color="error" size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.event_date || item.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={2}>
                        {item.event_date ? (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleViewDetails(item.id)}
                            sx={{ borderRadius: 2 }}
                          >
                            View Details
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => markNotificationRead(item.id)}
                            sx={{ borderRadius: 2 }}
                          >
                            Dismiss
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}

            <Box sx={{ mb: 3 }}>
              <QuickActions />
            </Box>

            <Box sx={{ mb: 3 }}>
              <DailyLessonPlans lessonPlans={lessonPlans} />
            </Box>

            <Box sx={{ mb: 3 }}>
              <ExamsAndResults exams={exams} results={examResults} assignments={assignmentGrades} />
            </Box>

            {/* Rate Your Teachers — inline */}
            <Box sx={{ mb: 3 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>Rate Teachers</Typography>
                      <Typography variant="body2" color="text.secondary">Your feedback helps improve teaching quality</Typography>
                    </Box>
                    <Button size="small" onClick={() => navigate('/teacher-ratings')}>View All</Button>
                  </Stack>
                  <Grid container spacing={1.5}>
                    {teachers.length === 0 ? (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                          No teachers available
                        </Typography>
                      </Grid>
                    ) : teachers.map((t, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Card variant="outlined" sx={{ p: 1 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: '#2196f3', width: 36, height: 36, fontSize: 14 }}>
                              {(t.user?.full_name || 'T')[0]}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" noWrap>{t.user?.full_name || '—'}</Typography>
                              <Rating value={t.rating || 0} readOnly size="small" precision={0.5} />
                            </Box>
                            <Button size="small" variant="outlined" onClick={() => openTeacherRating(t)}>Rate</Button>
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Box>

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
                  activities={filterDayAnnouncements}
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
        <AnnouncementDetailsModal
          open={announcementModalOpen}
          onClose={handleCloseModal}
          announcementDetails={announcementDetails}
          loading={modalLoading}
        />

        {/* Teacher Rating Dialog */}
        <Dialog open={ratingDialog} onClose={() => setRatingDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Rate — {selectedTeacher?.user?.full_name}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Category" value={ratingCategory} onChange={e => setRatingCategory(e.target.value)} fullWidth>
                {[
                  { value: 'teaching_quality', label: 'Teaching Quality' },
                  { value: 'punctuality', label: 'Punctuality' },
                  { value: 'communication', label: 'Communication' },
                  { value: 'classroom_management', label: 'Classroom Management' },
                  { value: 'student_engagement', label: 'Student Engagement' },
                  { value: 'overall', label: 'Overall' },
                ].map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Your Rating</Typography>
                <Rating value={ratingValue} onChange={(_, v) => setRatingValue(v)} size="large" />
              </Box>
              <TextField label="Comment (optional)" multiline rows={3} fullWidth value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Share your feedback..." />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRatingDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={submitTeacherRating} disabled={submittingRating || !ratingValue}>
              {submittingRating ? <CircularProgress size={18} /> : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
