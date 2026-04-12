import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Stack,
} from '@mui/material';
import { IconBook, IconUser } from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { gridSpacing } from 'store/constant';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';

const MySubjects = () => {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    fetchStudentInfo();
    fetchEnrolledSubjects();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.studentMe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Student info response:', data);
        
        // Handle different response structures
        const studentData = data.data || data;
        console.log('Parsed student data:', studentData);
        console.log('User:', studentData.user);
        console.log('Grade:', studentData.grade);
        console.log('Section:', studentData.section);
        
        setStudentInfo(studentData);
      } else {
        console.error('Failed to fetch student info:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const fetchEnrolledSubjects = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.studentSubjects}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Enrolled subjects response:', data);
        const subjectsData = data.data || data.results || [];
        setSubjects(subjectsData);
        
        if (subjectsData.length === 0) {
          toast.info('You are not enrolled in any subjects yet. Please contact your administrator.');
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch subjects:', errorText);
        toast.error('Failed to load enrolled subjects');
      }
    } catch (error) {
      console.error('Error fetching enrolled subjects:', error);
      toast.error('Error loading subjects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="My Subjects">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="My Subjects">
      <Grid container spacing={gridSpacing}>
        {/* Student Info Card */}
        {studentInfo && (
          <Grid item xs={12}>
            <DrogaCard>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Student Name</Typography>
                  <Typography variant="h4">
                    {studentInfo.user_details?.full_name || studentInfo.user?.full_name || studentInfo.full_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Class/Grade</Typography>
                  <Typography variant="h4">
                    {studentInfo.grade_details?.grade || studentInfo.grade?.grade || 'Not Assigned'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">Section</Typography>
                  <Typography variant="h4">
                    {studentInfo.section_details?.name || studentInfo.section?.name || 'Not Assigned'}
                  </Typography>
                </Grid>
              </Grid>
            </DrogaCard>
          </Grid>
        )}

        <Grid item xs={12}>
          <DrogaCard>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconBook size={28} />
              <Typography variant="h3" sx={{ ml: 1 }}>
                My Enrolled Subjects
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              View all subjects you are currently enrolled in and their assigned teachers
            </Typography>
          </DrogaCard>
        </Grid>

        {subjects.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  You are not enrolled in any subjects yet. Please contact your administrator to enroll in subjects.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          subjects.map((enrollment) => {
            const subject = enrollment.subject || {};
            const teacherDetails = enrollment.teacher_details;
            const teacherName = enrollment.teacher_name || teacherDetails?.full_name || 'Not assigned';

            return (
              <Grid item xs={12} sm={6} md={4} key={enrollment.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack spacing={2}>
                      {/* Subject Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                          <IconBook size={24} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" gutterBottom>
                            {subject.name || 'Unknown Subject'}
                          </Typography>
                          <Chip
                            label={subject.code || 'N/A'}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>

                      {/* Subject Description */}
                      {subject.description && (
                        <Typography variant="body2" color="text.secondary">
                          {subject.description}
                        </Typography>
                      )}

                      {/* Course Type */}
                      {subject.course_type && (
                        <Box>
                          <Chip
                            label={subject.course_type.name || 'Core'}
                            size="small"
                            color={
                              subject.course_type.name === 'Core' ? 'success' :
                              subject.course_type.name === 'Elective' ? 'info' :
                              'warning'
                            }
                          />
                        </Box>
                      )}

                      {/* Teacher Information */}
                      <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                            <IconUser size={18} />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Teacher
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {teacherName}
                            </Typography>
                            {teacherDetails?.email && (
                              <Typography variant="caption" color="text.secondary">
                                {teacherDetails.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Enrollment Date */}
                      <Typography variant="caption" color="text.secondary">
                        Enrolled on: {new Date(enrollment.enrolled_on).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
    </PageContainer>
  );
};

export default MySubjects;
