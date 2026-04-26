import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  useMediaQuery,
  Chip,
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import OverviewTab from './overview-tab';
import AcademicTab from './academic-tab';
import AttendanceBehaviorTab from './attendance-behavior-tab';

const PageContainer = ({ children }) => <>{children}</>;

export default function ChildProfilePage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user?.user);
  const userRole = user?.role?.toLowerCase() || 'parent';
  const [dashboardData, setDashboardData] = useState(null);
  const [academicData, setAcademicData] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTeacher = userRole === 'teacher';

  // Fetch teacher's assigned subjects for this student
  useEffect(() => {
    const loadTeacherSubjects = async () => {
      if (!isTeacher || !studentId) return;

      try {
        const token = await GetToken();
        // Fetch teacher's class-subject assignments
        const apiUrl = `${Backend.api}${Backend.classSubjectTeachers}`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Extract subject IDs that this teacher teaches
            const subjectIds = data.data
              .filter(item => item.subject_details)
              .map(item => item.subject_details.id);
            setTeacherSubjects([...new Set(subjectIds)]);
          }
        }
      } catch (err) {
        console.error('Error loading teacher subjects:', err);
      }
    };

    loadTeacherSubjects();
  }, [isTeacher, studentId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = await GetToken();

        // For teachers, use a different endpoint or the same one but filter data
        const endpoint = Backend.parentStudentDashboard.replace('{student_id}', studentId);
        const apiUrl = `${Backend.api}${endpoint}`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch student data');
        }

        const data = await response.json();
        if (data.success && data.data) {
          // Transform the data to match the expected structure for tab components
          const studentData = data.data.student || {};
          const transformedData = {
            // For header component
            student: {
              id: studentData.id,
              name: studentData.full_name,
              full_name: studentData.full_name,
              grade: studentData.grade,
              section: studentData.section,
              gender: studentData.gender,
              email: studentData.email,
            },
            // For overview-tab compatibility
            profile: {
              grade: studentData.grade,
              section: studentData.section,
            },
            grade: studentData.grade,
            section: studentData.section,
            // Attendance with summary structure
            attendance: data.data.attendance,
            attendance_percentage: data.data.attendance?.summary?.percentage || 0,
            // Other data
            subjects: data.data.subjects || [],
            schedule: data.data.schedule || [],
            assignments: data.data.assignments || [],
            announcements: data.data.announcements || [],
            exams: data.data.exams || [],
            exam_results: data.data.exam_results || [],
            progress: data.data.progress || {},
            enrolled_subjects_count: isTeacher ? teacherSubjects.length : (data.data.enrolled_subjects_count || 0),
            all_students: data.data.all_students || [],
            // Behavior ratings from backend (real data)
            behavior_ratings: data.data.behavior_ratings || {
              average_rating: 0,
              raw_average: 0,
              total_ratings: 0,
              recent_incidents_count: 0,
              category_averages: {}
            },
            // For teacher view - store which subjects they teach
            teacher_subject_ids: teacherSubjects,
          };
          setDashboardData(transformedData);
        } else {
          throw new Error(data.message || 'No data available');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error loading child profile:', err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadData();
    } else {
      setError('No student ID provided');
      setLoading(false);
    }
  }, [studentId, teacherSubjects, isTeacher]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = await GetToken();
        const apiUrl = `${Backend.auth}${Backend.parentStudentsAcademicProgress}${studentId}/`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch student data');
        }

        const data = await response.json();
        if (data.success) {
          // For teachers, filter subjects to only show ones they teach
          if (isTeacher && data.data?.subjects && teacherSubjects.length > 0) {
            const filteredData = {
              ...data.data,
              subjects: data.data.subjects.filter(subject =>
                teacherSubjects.includes(subject.subject_id) ||
                teacherSubjects.includes(subject.id)
              ),
            };
            setAcademicData(filteredData);
          } else {
            setAcademicData(data.data);
          }
        } else {
          throw new Error(data.message || 'No data available');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error loading child profile:', err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadData();
    } else {
      setError('No student ID provided');
      setLoading(false);
    }
  }, [studentId]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
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
          <Button
            onClick={() => navigate('/')}
            variant="contained"
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Button onClick={() => window.location.reload()} variant="outlined">
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <PageContainer>
      <Container
        maxWidth="xl"
        sx={{
          py: isMobile ? 1 : 3,
          bgcolor: '#f5f5f5',
          minHeight: '100vh',
          borderRadius: 2,
          px: isMobile ? 1 : 3,
        }}
      >
        {/* Header Section - Teacher gets different styling */}
        <Box
          sx={{
            mb: isMobile ? 2 : 4,
            bgcolor: isTeacher ? 'info.light' : 'background.paper',
            p: isMobile ? 1 : 2,
            borderRadius: 2,
            boxShadow: 1,
            border: isTeacher ? '2px solid' : 'none',
            borderColor: isTeacher ? 'info.main' : 'transparent',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 1 : 0,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography
                  variant={isMobile ? 'h5' : 'h3'}
                  fontWeight="bold"
                >
                  {isTeacher
                    ? (dashboardData.student?.full_name || dashboardData.student?.name || 'Student Profile')
                    : (dashboardData.student?.full_name || dashboardData.student?.name || 'Child Profile')}
                </Typography>
                {isTeacher && (
                  <Chip
                    icon={<SchoolIcon />}
                    label="Teacher View"
                    color="info"
                    variant="filled"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: isMobile ? 0 : 1 }}
              >
                {dashboardData.student?.grade && dashboardData.student?.section
                  ? `${dashboardData.student.grade} • ${dashboardData.student.section}`
                  : isTeacher
                    ? "Monitor student progress, assignments, and academic performance"
                    : "Track your child's daily academic and well-being progress"}
              </Typography>
              {isTeacher && teacherSubjects.length > 0 && (
                <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
                  You teach {teacherSubjects.length} subject{teacherSubjects.length !== 1 ? 's' : ''} to this student
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{
                height: 'fit-content',
                mt: isMobile ? 1 : 0,
                alignSelf: isMobile ? 'flex-end' : 'auto',
              }}
              size={isMobile ? 'small' : 'medium'}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>

        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label={isTeacher ? "Student Profile Tabs" : "Child Profile Tabs"}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            mb: isMobile ? 1 : 3,
            bgcolor: 'background.paper',
            width: isMobile ? '100%' : '35%',
            p: 0.5,
            borderRadius: 2,
            boxShadow: 1,
            '& .MuiTabs-flexContainer': {
              gap: 0.5,
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          {(isTeacher
            ? ['Overview', 'My Subjects', 'Attendance']
            : ['Overview', 'Academic', 'Attendance & Behavior']
          ).map(
            (label, index) => (
              <Tab
                key={label}
                label={isMobile ? label.split(' ')[0] : label}
                sx={{
                  cursor: 'pointer',
                  px: isMobile ? 1 : 2,
                  py: 0,
                  borderRadius: 3,
                  display: 'inline-flex',
                  alignItems: 'center',
                  minWidth: 'fit-content',
                  flexShrink: 0,
                  backgroundColor:
                    selectedTab === index ? 'primary.main' : 'transparent',
                  color:
                    selectedTab === index ? 'common.white' : 'text.primary',
                  '&:hover': {
                    backgroundColor:
                      selectedTab === index ? 'primary.dark' : 'action.hover',
                    color:
                      selectedTab === index ? 'common.white' : 'text.primary',
                  },
                  transition: 'all 0.3s ease',
                  boxShadow:
                    selectedTab === index
                      ? '0 2px 4px rgba(0,0,0,0.1)'
                      : 'none',
                  textTransform: 'none',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  fontWeight: selectedTab === index ? 600 : 500,
                  '&.Mui-selected': {
                    color: 'common.white',
                  },
                }}
              />
            ),
          )}
        </Tabs>

        {/* Tab Content */}
        <Box
          sx={{
            width: '100%',
            overflowX: 'hidden',
            mt: isMobile ? 1 : 0,
          }}
        >
          {selectedTab === 0 && (
            <OverviewTab data={dashboardData} isMobile={isMobile} userRole={userRole} studentId={studentId} />
          )}
          {selectedTab === 1 && (
            <AcademicTab
              data={academicData}
              isMobile={isMobile}
              studentId={studentId}
              userRole={userRole}
            />
          )}
          {selectedTab === 2 && (
            <AttendanceBehaviorTab data={dashboardData} isMobile={isMobile} userRole={userRole} />
          )}
        </Box>
      </Container>
    </PageContainer>
  );
}
