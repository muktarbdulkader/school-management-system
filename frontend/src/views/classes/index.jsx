import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Button,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ClassCard from './components/classCard';
import StatCard from './components/StatCard';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';
import { Skeleton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import { usePermissions } from 'utils/auth/hasPermission';
import { PERMISSIONS } from 'config/rolePermissions';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4285f4',
    },
    success: {
      main: '#34a853',
    },
    warning: {
      main: '#fbbc04',
    },
    error: {
      main: '#ea4335',
    },
  },
});

function Classes() {
  const [overview, setOverview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Active');
  const navigate = useNavigate();

  // Get user data from Redux store
  const user = useSelector((state) => state?.user?.user);
  const userRoles = user?.roles || [];

  // Determine user role
  const isTeacher = userRoles.some(role =>
    typeof role === 'string'
      ? role.toLowerCase() === 'teacher'
      : role?.name?.toLowerCase() === 'teacher'
  );

  const isStudent = userRoles.some(role =>
    typeof role === 'string'
      ? role.toLowerCase() === 'student'
      : role?.name?.toLowerCase() === 'student'
  );

  const isParent = userRoles.some(role =>
    typeof role === 'string'
      ? role.toLowerCase() === 'parent'
      : role?.name?.toLowerCase() === 'parent'
  );

  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission(PERMISSIONS.EDIT_CLASS);

  const handleClassCardClick = async (classItem, activeTab = 0) => {
    if (isAdmin) {
      // Super Admin: Go to class CRUD management, not sections
      navigate(`/classes/manage/${classItem.id || classItem.class_id}`, {
        state: { classData: classItem, activeTab: activeTab }
      });
      return;
    }

    try {
      const token = await GetToken();
      // Add subjectId to the URL - assuming it should be after section_id
      const Api = `${Backend.auth}${Backend.teachersClassDashboard}/${classItem.class_id}/${classItem.section_id}/${classItem.id}`;

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { method: 'GET', headers: header });

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        toast.warning('Server returned an error. Opening class detail directly...');
        navigate(`/classes/detail/${classItem.class_id}/${classItem.section_id}/${classItem.id}`, {
          state: { classData: classItem, subjectId: classItem.id, activeTab: activeTab },
        });
        return;
      }

      const responseData = await response.json();

      if (responseData.success) {
        navigate(`/classes/detail/${classItem.class_id}/${classItem.section_id}/${classItem.id}`, {
          state: {
            classData: classItem,
            attendanceData: responseData.data,
            subjectId: classItem.id,
            activeTab: activeTab,
          },
        });
      } else {
        toast.warning(responseData.message);
        navigate(`/classes/detail/${classItem.class_id}/${classItem.section_id}/${classItem.id}`, {
          state: { classData: classItem, subjectId: classItem.id, activeTab: activeTab },
        });
      }
    } catch (error) {
      toast.error(error.message);
      navigate(`/classes/detail/${classItem.class_id}/${classItem.section_id}/${classItem.id}`, {
        state: { classData: classItem, subjectId: classItem.id, activeTab: activeTab },
      });
    }
  };

  const subjectIcons = {
    Math: '📐',
    English: '📚',
    Civics: '🏛️',
    Music: '🎵',
  };

  const handleFetchingOverview = async () => {
    setLoading(true);
    const token = await GetToken();

    let Api;

    console.log('User roles:', userRoles);
    console.log('isTeacher:', isTeacher, 'isStudent:', isStudent, 'isParent:', isParent, 'isAdmin:', isAdmin);

    // Determine which endpoint to call based on user role
    if (isTeacher) {
      Api = `${Backend.auth}${Backend.teachersOverviewDashboard}`;
      console.log('Fetching teacher overview from:', Api);
    } else if (isStudent) {
      Api = `${Backend.api}${Backend.studentSubjects}`;
      console.log('Fetching student subjects from:', Api);
    } else if (isParent) {
      // For parents, we'll need to create a parent-specific endpoint
      toast.info('Parent class view coming soon');
      setLoading(false);
      return;
    } else if (isAdmin) {
      // For admins, fetch all classes
      Api = `${Backend.auth}${Backend.classes}`;
      console.log('Fetching admin classes from:', Api);
    } else {
      toast.error('Unable to determine user role');
      setLoading(false);
      return;
    }

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      console.log('API Response:', responseData);

      if (responseData.success) {
        if (isAdmin) {
          // Transform admin data to match expected format
          const classes = responseData.data || [];
          // Calculate total active students by summing student_count from all classes
          const totalActiveStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);
          const transformedData = {
            summary: {
              total_classes: classes.length,
              active_students: totalActiveStudents,
              assignments_due: 0 // Would need to aggregate from all classes
            },
            subjects: classes.map(cls => ({
              id: cls.id,
              name: cls.grade,
              class_id: cls.id,
              class_name: cls.grade,
              class_section: cls.grade, // Map it here
              section_id: null,
              section_name: null,
              student_count: cls.student_count || 0,
              attendance_rate: cls.attendance_rate || 0,
            }))
          };
          setOverview(transformedData);
        } else if (isStudent) {
          // Transform individual student subjects to match ClassCard format
          const enrollments = responseData.data || [];
          const transformedData = {
            summary: {
              total_classes: enrollments.length,
              active_students: 1,
              assignments_due: 0
            },
            subjects: enrollments.map(en => ({
              id: en.id,
              name: en.subject_id_details?.name || 'Unknown Subject',
              class_id: en.student_id_details?.grade,
              class_name: en.student_id_details?.grade_details?.grade || 'General',
              class_section: en.student_id_details?.grade_details?.grade || 'General',
              section_id: en.student_id_details?.section,
              section_name: en.student_id_details?.section_details?.name,
              student_count: 1,
              status: 'Enrolled'
            }))
          };
          setOverview(transformedData);
        } else {
          console.log('Setting teacher data:', responseData.data);
          setOverview(responseData.data);
        }
      } else {
        toast.warning(responseData.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
      toast.error(error.message || 'Failed to fetch overview data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollAll = async (classItem) => {
    const token = await GetToken();
    const classId = classItem.class_id || classItem.id;

    // Ensure only one slash between API base and path
    const apiBase = Backend.api.endsWith('/') ? Backend.api.slice(0, -1) : Backend.api;
    const Api = `${apiBase}/classes/${classId}/enroll_all_class_subjects/`;
    const header = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'POST', headers: header });
      const responseData = await response.json();
      if (responseData.success) {
        toast.success(responseData.message || 'Successfully enrolled all students!');
        handleFetchingOverview();
      } else {
        toast.error(responseData.message || 'Failed to enroll students');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    handleFetchingOverview();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', p: 3 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {isTeacher ? 'My Classes' : isAdmin ? 'All Classes' : 'Classes'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isTeacher
                  ? "Here are the classes you're teaching this term."
                  : isAdmin
                    ? "Overview of all classes in the system."
                    : "Your enrolled classes."}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<IconPlus size={18} />}
                  onClick={() => navigate('/admin/classes/create')}
                >
                  Add New Class
                </Button>
              )}
              {isAdmin && (
                <FormControl size="small">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      minWidth: 100,
                    }}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="All">All</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Skeleton
                    variant="rectangular"
                    height={100}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>
              ))
            ) : (
              <>
                <Grid item xs={12} md={4}>
                  <StatCard
                    title="Total Classes"
                    value={overview?.summary?.total_classes ?? 0}
                    subtitle={
                      overview?.summary?.total_classes > 0
                        ? 'All Active'
                        : 'No Classes'
                    }
                    color="#2e7d32"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <StatCard
                    title="Active Students"
                    value={overview?.summary?.active_students ?? 0}
                    subtitle={
                      overview?.summary?.active_students > 0
                        ? 'Students Enrolled'
                        : 'No Active Students'
                    }
                    color="#1976d2"
                  />
                </Grid>
              </>
            )}
          </Grid>

          {/* Classes Grid - Filtered by status */}
          <Grid container spacing={3}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} md={6} key={i}>
                  <Skeleton
                    variant="rectangular"
                    height={200}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>
              ))
              : overview?.subjects?.filter((classItem) => {
                // Apply status filter for admins
                if (!isAdmin || statusFilter === 'All') return true;
                const isActive = classItem.is_active !== false;
                return statusFilter === 'Active' ? isActive : !isActive;
              }).map((classItem, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <div
                    onClick={() => handleClassCardClick(classItem)}
                    style={{ cursor: 'pointer' }}
                  >
                    <ClassCard
                      {...classItem}
                      icon={subjectIcons[classItem.name] || '📘'}
                      handleClassCardClick={handleClassCardClick}
                      handleEnrollAll={handleEnrollAll}
                      classItem={classItem}
                      isAdmin={isAdmin}
                    />
                  </div>
                </Grid>
              ))}
          </Grid>
        </Box>
      </Box>
      <ToastContainer />
    </ThemeProvider>
  );
}

export default Classes;
