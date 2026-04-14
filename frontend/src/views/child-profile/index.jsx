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
} from '@mui/material';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = await GetToken();
        // Use generic students endpoint - works for teachers, parents, and admins
        const endpoint = Backend.studentsDetail.replace('{id}', studentId);
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
        if (data.success) {
          setDashboardData(data.data);
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
          setAcademicData(data.data);
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
        {/* Header Section */}
        <Box
          sx={{
            mb: isMobile ? 2 : 4,
            bgcolor: 'background.paper',
            p: isMobile ? 1 : 2,
            borderRadius: 2,
            boxShadow: 1,
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
              <Typography
                variant={isMobile ? 'h5' : 'h3'}
                fontWeight="bold"
                sx={{ mb: 1 }}
              >
                {dashboardData.student?.name || 'Child Profile'}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: isMobile ? 0 : 1 }}
              >
                {dashboardData.student?.grade && dashboardData.student?.section
                  ? `${dashboardData.student.grade} • ${dashboardData.student.section}`
                  : "Track your child's daily academic and well-being progress"}
              </Typography>
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
          aria-label="Child Profile Tabs"
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
          {['Overview', 'Academic', 'Attendance & Behavior'].map(
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
            <OverviewTab data={dashboardData} isMobile={isMobile} />
          )}
          {selectedTab === 1 && (
            <AcademicTab
              data={academicData}
              isMobile={isMobile}
              studentId={studentId}
            />
          )}
          {selectedTab === 2 && (
            <AttendanceBehaviorTab data={dashboardData} isMobile={isMobile} />
          )}
        </Box>
      </Container>
    </PageContainer>
  );
}
