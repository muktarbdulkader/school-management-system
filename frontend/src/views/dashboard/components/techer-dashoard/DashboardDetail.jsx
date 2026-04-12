import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert
} from '@mui/material';
import {
  Users,
  BookOpen,
  ClipboardCheck,
  Calendar,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../../../services/api';
import Backend from '../../../../services/backend';

const DashboardDetail = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${Backend.api}${Backend.teachersOverviewDashboard}`);
      console.log('Teacher dashboard response:', response.data);
      
      if (response.data?.success) {
        setDashboardData(response.data.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const summary = dashboardData?.summary || {};
  const subjects = dashboardData?.subjects || [];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Welcome back, {user?.full_name || 'Teacher'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your classes today
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Classes
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {summary.total_classes || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <BookOpen size={28} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Active Students
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {summary.active_students || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Users size={28} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Assignments Due
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {summary.assignments_due || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <ClipboardCheck size={28} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* My Classes Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  My Classes
                </Typography>
                <Button 
                  endIcon={<ArrowRight size={16} />}
                  onClick={() => navigate('/classes')}
                >
                  View All
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Section</TableCell>
                      <TableCell align="center">Students</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No classes assigned</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      subjects.map((subject, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {subject.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {subject.name}
                                </Typography>
                                {subject.code && (
                                  <Typography variant="caption" color="text.secondary">
                                    {subject.code}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{subject.class_name}</TableCell>
                          <TableCell>{subject.section_name || 'All'}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={subject.student_count} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => navigate(`/classes/detail/${subject.class_id}/${subject.section_id || 'null'}/${subject.id}`, { state: { classData: subject } })}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Quick Actions
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ClipboardCheck size={20} />}
                  onClick={() => navigate('/attendance')}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Mark Attendance
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BookOpen size={20} />}
                  onClick={() => navigate('/assignments')}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Create Assignment
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Calendar size={20} />}
                  onClick={() => navigate('/planning')}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Add Lesson Plan
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MessageSquare size={20} />}
                  onClick={() => navigate('/messages_teacher')}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Send Message
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Users size={20} />}
                  onClick={() => navigate('/students')}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  View Students
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Today's Schedule
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/schedule')}
              >
                View Full Schedule
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardDetail;