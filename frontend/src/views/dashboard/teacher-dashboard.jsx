import {
  LayoutGrid,
  GraduationCap,
  FileText,
  ClipboardList,
  MessageSquare,
  Calendar,
  BarChart2,
  AlertTriangle,
  Clock,
  Bell,
  Package,
  Star,
  BookOpen,
  Users,
  Download,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { DashboardCard } from './components/techer-dashoard/TeacherDashboardCard';
import { Box, Grid, Typography, Card, CardContent, Avatar, Chip, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AddButton from 'ui-component/buttons/AddButton';
import AddDailyLesson from './components/techer-dashoard/components/AddDailyLesson';
import { useEffect, useState } from 'react';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast, ToastContainer } from 'react-toastify';

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user?.user);
  const [add, setAdd] = useState();
  const [loading, setLoading] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [subunits, setSubunits] = useState([]);
  const [learningObjectives, setLearningObjectives] = useState([]);
  const [learnerGroups, setLearnerGroups] = useState([]);
  const [groupSections, setGroupSections] = useState([]);
  const [terms, setTerms] = useState([]);

  // Tasks and Reports
  const [teacherTasks, setTeacherTasks] = useState([]);
  const [teacherReports, setTeacherReports] = useState([]);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    notifications: 0,
    classesToday: 0,
    attendanceStatus: 'Not marked yet',
    assignmentsToReview: 0,
    newMessages: 0,
    upcomingMeetings: 0,
    termEndDate: null,
    scheduleSlots: 0,
    pendingRequests: 0,
    myRating: 0,
    blogPosts: 0,
    meetingRequests: 0,
  });

  const handleFetchingSubjects = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.api}${Backend.classSubjectTeachers}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        // Extract unique subjects from teacher assignments
        const uniqueSubjects = [...new Map(responseData.data
          .filter(item => item.subject)
          .map(item => {
            const subjectData = item.subject;
            return [subjectData.id, subjectData];
          })
        ).values()];
        setSubjects(uniqueSubjects);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchingUnits = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.objectiveUnits}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setUnits(responseData.data);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchingSubunits = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.objectiveSubunits}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setSubunits(responseData.data);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchingLearningObjectives = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.learningObjectives}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setLearningObjectives(responseData.data);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchingLearnerGroups = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.api}${Backend.classSubjectTeachers}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        // Extract unique classes from teacher assignments
        const uniqueClasses = [...new Map(responseData.data
          .filter(item => item.class_fk)
          .map(item => {
            const classData = item.class_fk;
            return [classData.id, classData];
          })
        ).values()];
        setLearnerGroups(uniqueClasses);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchingTerms = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.terms}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setTerms(responseData.data);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchingGroupSections = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.sections}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (responseData.success) {
        setGroupSections(responseData.data);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch teacher tasks assigned by admin
  const fetchTeacherTasks = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.teacherTasks}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setTeacherTasks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching teacher tasks:', error);
    }
  };

  // Fetch performance reports generated for teacher
  const fetchTeacherReports = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.teacherReports}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setTeacherReports(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching teacher reports:', error);
    }
  };

  useEffect(() => {
    handleFetchingSubjects();
    handleFetchingUnits();
    handleFetchingSubunits();
    handleFetchingLearningObjectives();
    handleFetchingLearnerGroups();
    handleFetchingGroupSections();
    handleFetchingTerms();
    fetchDashboardStats();
    fetchTeacherTasks();
    fetchTeacherReports();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const today = new Date().toISOString().split('T')[0];

      // Initialize default values
      const stats = {
        notifications: 0,
        classesToday: 0,
        attendanceStatus: 'Not marked yet',
        assignmentsToReview: 0,
        newMessages: 0,
        upcomingMeetings: 0,
        termEndDate: 'No active term',
        scheduleSlots: 0,
        pendingRequests: 0,
        myRating: 0,
        blogPosts: 0,
        meetingRequests: 0,
      };

      // Helper function to safely fetch data
      const safeFetch = async (url, defaultValue = null) => {
        try {
          if (!url || url.includes('undefined')) {
            console.warn('Skipping undefined URL:', url);
            return defaultValue;
          }
          const response = await fetch(url, { method: 'GET', headers: header });
          const data = await response.json();
          return data.success ? data.data : defaultValue;
        } catch (err) {
          console.error(`Error fetching ${url}:`, err);
          return defaultValue;
        }
      };

      // Fetch all data in parallel
      const [
        overviewData,
        announcementsData,
        meetingsData,
        assignmentsData,
        attendanceData,
        termsData,
        scheduleData,
        resourcesData,
        ratingsData,
        blogData,
      ] = await Promise.all([
        safeFetch(`${Backend.auth}${Backend.teachersOverviewDashboard}`, null),
        safeFetch(`${Backend.auth}${Backend.announcements}`, []),
        safeFetch(`${Backend.auth}${Backend.communicationMeetings}`, []),
        safeFetch(`${Backend.auth}${Backend.assignments}`, []),
        safeFetch(`${Backend.auth}${Backend.attendance}?date=${today}`, []),
        safeFetch(`${Backend.auth}${Backend.terms}`, []),
        safeFetch(`${Backend.auth}${Backend.classScheduleSlots}`, []),
        safeFetch(`${Backend.api}${Backend.resourceRequests}`, []),
        safeFetch(`${Backend.auth}${Backend.teachersPerformanceRatings}`, []),
        safeFetch(`${Backend.auth}${Backend.blogPosts}`, []),
      ]);

      // Process overview data
      if (overviewData?.summary) {
        stats.classesToday = overviewData.summary.total_classes || 0;
      }

      // Process announcements
      if (Array.isArray(announcementsData)) {
        stats.notifications = announcementsData.length;
      }

      // Process meetings
      if (Array.isArray(meetingsData)) {
        stats.upcomingMeetings = meetingsData.filter(
          m => m.scheduled_date >= today && m.status !== 'cancelled'
        ).length;
        stats.meetingRequests = meetingsData.filter(
          m => m.status === 'pending'
        ).length;
      }

      // Process assignments
      if (Array.isArray(assignmentsData)) {
        stats.assignmentsToReview = assignmentsData.length;
      }

      // Process attendance
      if (Array.isArray(attendanceData)) {
        const todayAttendance = attendanceData.filter(a => a.date === today);
        if (todayAttendance.length > 0) {
          stats.attendanceStatus = `${todayAttendance.length} marked today`;
        }
      }

      // Process terms
      if (Array.isArray(termsData) && termsData.length > 0) {
        const currentTerm = termsData.find(t => {
          const start = new Date(t.start_date);
          const end = new Date(t.end_date);
          const now = new Date();
          return now >= start && now <= end;
        });
        if (currentTerm) {
          const endDate = new Date(currentTerm.end_date);
          const daysUntilEnd = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
          const weeksUntilEnd = Math.ceil(daysUntilEnd / 7);
          stats.termEndDate = weeksUntilEnd > 0
            ? `${weeksUntilEnd} week${weeksUntilEnd !== 1 ? 's' : ''}`
            : 'This week';
        }
      }

      // Process schedule
      if (Array.isArray(scheduleData)) {
        stats.scheduleSlots = scheduleData.length;
      }

      // Process resource requests
      if (Array.isArray(resourcesData)) {
        stats.pendingRequests = resourcesData.filter(r => r.status === 'pending').length;
      }

      // Process ratings
      if (Array.isArray(ratingsData) && ratingsData.length > 0) {
        const totalRating = ratingsData.reduce((sum, r) => sum + (r.rating || 0), 0);
        stats.myRating = (totalRating / ratingsData.length).toFixed(1);
      }

      // Process blog posts
      if (Array.isArray(blogData)) {
        stats.blogPosts = blogData.length;
      }

      setDashboardStats(stats);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Some dashboard data could not be loaded');
    }
  };

  const handleAddLessonClick = () => {
    setAdd(true);
    handleFetchingSubjects();
    handleFetchingUnits();
    handleFetchingSubunits();
    handleFetchingLearningObjectives();
    handleFetchingLearnerGroups();
    handleFetchingGroupSections();
    handleFetchingTerms();
  };

  const handleLessonModalClose = () => {
    setAdd(false);
  };

  // const handleLessonSubmit = async (lessonData) => {
  //   setIsAddingLesson(true);
  //   try {
  //     // Replace with your actual API call
  //     console.log('Submitting lesson:', lessonData);
  //     // await yourApiCallToAddLesson(lessonData);
  //     // toast.success('Lesson added successfully!');
  //     handleLessonModalClose();
  //   } catch (error) {
  //     console.error('Error adding lesson:', error);
  //     // toast.error('Failed to add lesson');
  //   } finally {
  //     setIsAddingLesson(false);
  //   }
  // };

  // const handleLessonSubmit = async (lessonData) => {
  //   setIsAddingLesson(true);
  // }

  const handleLessonSubmit = async (lessonData) => {
    setIsAddingLesson(true);
    const token = await GetToken();
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      // First, get the teacher's ClassSubjectTeacher assignment for this subject and class
      const teacherAssignmentsRes = await fetch(`${Backend.api}${Backend.classSubjectTeachers}`, {
        method: 'GET',
        headers: header
      });
      const teacherAssignmentsData = await teacherAssignmentsRes.json();

      if (!teacherAssignmentsData.success || !teacherAssignmentsData.data.length) {
        toast.error('No teacher assignments found. Please contact administrator.');
        setIsAddingLesson(false);
        return;
      }

      // Find the matching TeacherAssignment
      const matchingAssignment = teacherAssignmentsData.data.find(assignment => {
        const assignmentSubjectId = assignment.subject?.id;
        const assignmentClassId = assignment.class_fk?.id;
        return assignmentSubjectId === lessonData.subject_id && assignmentClassId === lessonData.learner_group_id;
      });

      if (!matchingAssignment) {
        toast.error('You are not assigned to teach this subject for this class. Please contact administrator.');
        setIsAddingLesson(false);
        return;
      }

      // Set the created_by to the TeacherAssignment ID
      const lessonPayload = {
        ...lessonData,
        created_by: matchingAssignment.id,
      };

      // Step 1: Create lesson plan
      const ApiLessonPlan = Backend.auth + Backend.lessonPlans;
      const response = await fetch(ApiLessonPlan, {
        method: 'POST',
        headers: header,
        body: JSON.stringify(lessonPayload),
      });

      const responseData = await response.json();

      if (!response.ok) throw responseData;

      if (responseData.success) {
        const lessonPlanId = responseData.data.id;

        // Step 2: Create lesson activities (use actual data from the form)
        const lessonActivitiesPromises = lessonData.lesson_activities.map(
          (activity) => {
            const lessonActivityPayload = {
              lesson_plan_id: lessonPlanId,
              order_number: activity.order_number || 1,
              time_slot: activity.time_slot || '',
              topic_content: activity.topic_content || '',
              learner_activity: activity.learner_activity || '',
              formative_assessment: activity.formative_assessment || '',
              materials: activity.materials || '',
            };

            return fetch(Backend.auth + Backend.lessonActivities, {
              method: 'POST',
              headers: header,
              body: JSON.stringify(lessonActivityPayload),
            });
          },
        );

        // Step 3: Create lesson evaluations (use actual data from the form)
        const lessonEvaluationsPromises = lessonData.lesson_evaluations.map(
          (evaluation) => {
            const lessonEvaluationPayload = {
              lesson_plan_id: lessonPlanId,
              section:
                evaluation.groupSections || lessonData.group_section || '',
              lesson_plan_evaluation: evaluation.lesson_plan_evaluation || '',
            };

            return fetch(Backend.auth + Backend.lessonPlanEvaluations, {
              method: 'POST',
              headers: header,
              body: JSON.stringify(lessonEvaluationPayload),
            });
          },
        );

        // Wait for all activities and evaluations to be created
        await Promise.all([
          ...lessonActivitiesPromises,
          ...lessonEvaluationsPromises,
        ]);

        toast.success(
          'Daily Lesson added successfully with activities & evaluations!',
        );
      } else {
        toast.error(responseData?.message || 'Failed to add Daily Lesson');
      }
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsAddingLesson(false);
      handleLessonModalClose();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f8fafc',
        p: { xs: 2, md: 4 },
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Welcome Header */}
      <Paper
        elevation={0}
        sx={{
          background: '#ffffff',
          borderRadius: '24px',
          p: 4,
          mb: 4,
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.03))',
            pointerEvents: 'none'
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                fontSize: 32,
                fontWeight: 800,
                boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.3)',
                border: '4px solid #ffffff'
              }}
            >
              {user?.full_name?.charAt(0) || 'T'}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
                Welcome back, {user?.full_name || 'Teacher'}!
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)', borderRadius: '12px' }}>
            <AddButton title="Add Daily Lesson" onPress={() => navigate('/planning')} />
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mt: 4, position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2.5, borderRadius: '20px', backgroundColor: '#eff6ff', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: '#dbeafe', color: '#2563eb' }}>
                  <GraduationCap size={20} strokeWidth={2.5} />
                </Box>
                <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 600 }}>Classes Today</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
                {dashboardStats.classesToday}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2.5, borderRadius: '20px', backgroundColor: '#fffbeb', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706' }}>
                  <ClipboardList size={20} strokeWidth={2.5} />
                </Box>
                <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 600 }}>To Review</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#92400e' }}>
                {dashboardStats.assignmentsToReview}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2.5, borderRadius: '20px', backgroundColor: '#f0fdf4', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                  <CheckCircle size={20} strokeWidth={2.5} />
                </Box>
                <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 600 }}>Attendance</Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#166534', mt: 0.5 }}>
                {dashboardStats.attendanceStatus}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2.5, borderRadius: '20px', backgroundColor: '#fdf2f8', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: '#fce7f3', color: '#db2777' }}>
                  <Star size={20} strokeWidth={2.5} />
                </Box>
                <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 600 }}>My Rating</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#9d174d' }}>
                {dashboardStats.myRating > 0 ? `${dashboardStats.myRating}/5` : 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Dashboard Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<LayoutGrid size={24} />}
            title="Dashboard"
            description="Get a quick overview of your day, including schedule and important alerts"
            buttonText="Start My Day"
            buttonHref="#"
            statusText={`${dashboardStats.notifications} notification${dashboardStats.notifications !== 1 ? 's' : ''}`}
            statusColor={dashboardStats.notifications > 0 ? "#22c55e" : "#9ca3af"}
            gradientFrom="#3b82f6"
            gradientTo="#8b5cf6"
            onClick={() => navigate('/teacher-overview')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<GraduationCap size={24} />}
            title="My Classes"
            description="View your class roster, schedule, and manage your teaching groups"
            buttonText="Open Class List"
            buttonHref="#"
            statusText={`${dashboardStats.classesToday} class${dashboardStats.classesToday !== 1 ? 'es' : ''} assigned`}
            statusColor="#22c55e"
            gradientFrom="#a855f7"
            gradientTo="#6366f1"
            onClick={() => navigate('/classes')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<FileText size={24} />}
            title="Attendance"
            description="Track student attendance and view historical attendance records"
            buttonText="Mark Attendance"
            buttonHref="#"
            statusText={dashboardStats.attendanceStatus}
            statusColor="#fb923c"
            gradientFrom="#22c55e"
            gradientTo="#059669"
            onClick={() => navigate('/attendance')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<ClipboardList size={24} />}
            title="Assignments"
            description="Create, assign, and grade student work and homework tasks"
            buttonText="Manage Assignments"
            buttonHref="#"
            statusText={`${dashboardStats.assignmentsToReview} to review`}
            statusColor={dashboardStats.assignmentsToReview > 0 ? "#ef4444" : "#22c55e"}
            gradientFrom="#f97316"
            gradientTo="#f59e0b"
            onClick={() => navigate('/assignments')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<MessageSquare size={24} />}
            title="Messages"
            description="Communicate with students, parents, and other staff members"
            buttonText="Go to Inbox"
            buttonHref="#"
            statusText={`${dashboardStats.newMessages} new message${dashboardStats.newMessages !== 1 ? 's' : ''}`}
            statusColor={dashboardStats.newMessages > 0 ? "#22c55e" : "#9ca3af"}
            gradientFrom="#0ea5e9"
            gradientTo="#2563eb"
            onClick={() => navigate('/messages_teacher')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<Calendar size={24} />}
            title="Meetings"
            description="Schedule and manage parent-teacher conferences and staff meetings"
            buttonText="Check Calendar"
            buttonHref="#"
            statusText={`${dashboardStats.upcomingMeetings} upcoming`}
            statusColor={dashboardStats.upcomingMeetings > 0 ? "#a855f7" : "#9ca3af"}
            gradientFrom="#d946ef"
            gradientTo="#9333ea"
            onClick={() => navigate('/meeting-history')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<BarChart2 size={24} />}
            title="Reports"
            description="Track student attendance and view historical attendance records"
            buttonText="Enter Grades"
            buttonHref="#"
            statusText={`Term ends in ${dashboardStats.termEndDate}`}
            statusColor="#22c55e"
            gradientFrom="#06b6d4"
            gradientTo="#0d9488"
            onClick={() => navigate('/grades')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<AlertTriangle size={24} />}
            title="Behavior"
            description="Track student behavior, add notes, and generate reports"
            buttonText="Add Behavior Note"
            buttonHref="#"
            statusText="No recent issues"
            statusColor="#ef4444"
            gradientFrom="#fb7185"
            gradientTo="#dc2626"
            onClick={() => navigate('/behavior')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<Clock size={24} />}
            title="Schedule"
            description="View your class schedule and timetable for the week"
            buttonText="View Schedule"
            buttonHref="#"
            statusText={`${dashboardStats.scheduleSlots} slot${dashboardStats.scheduleSlots !== 1 ? 's' : ''} this week`}
            statusColor="#3b82f6"
            gradientFrom="#6366f1"
            gradientTo="#4f46e5"
            onClick={() => navigate('/schedule')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<Bell size={24} />}
            title="Announcements"
            description="View school announcements, alerts, and urgent notices"
            buttonText="View All"
            buttonHref="#"
            statusText={`${dashboardStats.notifications} new alert${dashboardStats.notifications !== 1 ? 's' : ''}`}
            statusColor={dashboardStats.notifications > 0 ? "#ef4444" : "#22c55e"}
            gradientFrom="#f59e0b"
            gradientTo="#d97706"
            onClick={() => navigate('/announcements')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<Package size={24} />}
            title="Resources"
            description="Request school supplies, materials, and exam paper duplication"
            buttonText="Request Materials"
            buttonHref="#"
            statusText={`${dashboardStats.pendingRequests} pending request${dashboardStats.pendingRequests !== 1 ? 's' : ''}`}
            statusColor={dashboardStats.pendingRequests > 0 ? "#fb923c" : "#22c55e"}
            gradientFrom="#10b981"
            gradientTo="#059669"
            onClick={() => navigate('/resource-requests')}
          />
        </Grid>


        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<BookOpen size={24} />}
            title="School Blog"
            description="Read school news, updates, and educational articles"
            buttonText="Read Blog"
            buttonHref="#"
            statusText={`${dashboardStats.blogPosts} post${dashboardStats.blogPosts !== 1 ? 's' : ''} available`}
            statusColor="#8b5cf6"
            gradientFrom="#a855f7"
            gradientTo="#7c3aed"
            onClick={() => navigate('/blog')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<Users size={24} />}
            title="Meeting Requests"
            description="Manage parent-teacher meeting requests and schedule conferences"
            buttonText="View Requests"
            buttonHref="#"
            statusText={`${dashboardStats.meetingRequests} pending request${dashboardStats.meetingRequests !== 1 ? 's' : ''}`}
            statusColor={dashboardStats.meetingRequests > 0 ? "#ef4444" : "#22c55e"}
            gradientFrom="#ec4899"
            gradientTo="#db2777"
            onClick={() => navigate('/meeting-requests')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<BookOpen size={24} />}
            title="Library"
            description="Access school library resources and manage book borrowing"
            buttonText="Browse Library"
            buttonHref="#"
            statusText="Resources available"
            statusColor="#06b6d4"
            gradientFrom="#0ea5e9"
            gradientTo="#0284c7"
            onClick={() => navigate('/library')}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<Download size={24} />}
            title="Data Export"
            description="Export student data, grades, attendance, and report cards"
            buttonText="Export Data"
            buttonHref="#"
            statusText="CSV, Excel, PDF"
            statusColor="#14b8a6"
            gradientFrom="#14b8a6"
            gradientTo="#0d9488"
            onClick={() => navigate('/data-export')}
          />
        </Grid>

        {/* Admin Assigned Tasks */}
        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<ClipboardList size={24} />}
            title="My Tasks"
            description="View tasks and assignments from administrators"
            buttonText="View Tasks"
            buttonHref="#"
            statusText={`${teacherTasks.filter(t => t.status !== 'completed').length} pending task${teacherTasks.filter(t => t.status !== 'completed').length !== 1 ? 's' : ''}`}
            statusColor={teacherTasks.filter(t => t.status !== 'completed').length > 0 ? "#ef4444" : "#22c55e"}
            gradientFrom="#f59e0b"
            gradientTo="#d97706"
            onClick={() => navigate('/teacher-tasks')}
          />
        </Grid>

        {/* Performance Reports */}
        <Grid item xs={12} sm={6} lg={6} xl={3}>
          <DashboardCard
            icon={<FileText size={24} />}
            title="My Reports"
            description="View performance reports generated by administrators"
            buttonText="View Reports"
            buttonHref="#"
            statusText={`${teacherReports.length} report${teacherReports.length !== 1 ? 's' : ''}`}
            statusColor={teacherReports.length > 0 ? "#22c55e" : "#9ca3af"}
            gradientFrom="#8b5cf6"
            gradientTo="#7c3aed"
            onClick={() => navigate('/teacher-reports')}
          />
        </Grid>
      </Grid>
      <ToastContainer />

      <AddDailyLesson
        add={add}
        onClose={handleLessonModalClose}
        onSubmit={handleLessonSubmit}
        isAdding={isAddingLesson}
        subjects={subjects}
        units={units}
        subunits={subunits}
        learnerGroups={learnerGroups}
        groupSections={groupSections}
        learningObjectives={learningObjectives}
        terms={terms}
      />
    </Box>
  );
}
