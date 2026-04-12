import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  IconBook,
  IconUser,
  IconCalendar,
  IconClipboardList,
  IconTrophy,
} from '@tabler/icons-react';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { useNavigate } from 'react-router-dom';

export default function StudentClassesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState({});

  useEffect(() => {
    fetchStudentClasses();
  }, []);

  const fetchStudentClasses = async () => {
    setLoading(true);
    setError('');

    try {
      const token = await GetToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch student profile
      const profileUrl = `${Backend.api}${Backend.studentMe}`;
      const profileRes = await fetch(profileUrl, { headers });
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        console.log('Student Profile API Response:', profileData);
        console.log('Grade Details:', profileData.data?.grade_details || profileData.grade_details);
        console.log('Section Details:', profileData.data?.section_details || profileData.section_details);
        setStudentProfile(profileData.data || profileData);
      } else {
        console.error('Profile fetch failed:', profileRes.status, await profileRes.text());
      }

      // Fetch enrolled subjects
      const subjectsUrl = `${Backend.api}${Backend.studentSubjects}`;
      const subjectsRes = await fetch(subjectsUrl, { headers });
      
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        const subjectsList = subjectsData.data || subjectsData.results || [];
        setSubjects(subjectsList);
      }

      // Fetch grades/exam results
      const gradesUrl = `${Backend.api}${Backend.examResults}`;
      const gradesRes = await fetch(gradesUrl, { headers });
      
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        const gradesList = gradesData.data || gradesData.results || [];
        
        // Organize grades by subject
        const gradesBySubject = {};
        gradesList.forEach(grade => {
          const subjectId = grade.subject_id || grade.subject?.id;
          if (subjectId) {
            if (!gradesBySubject[subjectId]) {
              gradesBySubject[subjectId] = [];
            }
            gradesBySubject[subjectId].push(grade);
          }
        });
        setGrades(gradesBySubject);
      }

    } catch (err) {
      console.error('Error fetching student classes:', err);
      setError(err.message || 'Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubjectAverage = (subjectId) => {
    const subjectGrades = grades[subjectId] || [];
    if (subjectGrades.length === 0) return null;
    
    const total = subjectGrades.reduce((sum, grade) => {
      const score = parseFloat(grade.marks_obtained || grade.score || 0);
      return sum + score;
    }, 0);
    
    return (total / subjectGrades.length).toFixed(1);
  };

  const getGradeColor = (average) => {
    if (!average) return 'default';
    const avg = parseFloat(average);
    if (avg >= 90) return 'success';
    if (avg >= 80) return 'primary';
    if (avg >= 70) return 'info';
    if (avg >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Classes & Subjects
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your enrolled subjects, teachers, and academic performance
        </Typography>
      </Box>

      {/* Student Info Card */}
      {studentProfile && (
        <Card sx={{ mb: 4, bgcolor: 'primary.light' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Avatar
                  sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}
                >
                  {(studentProfile.user_details?.full_name || studentProfile.user?.full_name || 'S').charAt(0)}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h5">
                  {studentProfile.user_details?.full_name || studentProfile.user?.full_name || 'Student'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Grade: {studentProfile.grade_details?.grade || studentProfile.grade?.grade || 'N/A'} | 
                  Section: {studentProfile.section_details?.name || studentProfile.section?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {subjects.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Enrolled Subjects
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <IconBook size={48} color="#ccc" />
            <Typography variant="h6" sx={{ mt: 2 }} color="text.secondary">
              No Subjects Enrolled
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You are not enrolled in any subjects yet. Please contact your administrator.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {subjects.map((subject) => {
            const subjectId = subject.subject_id?.id || subject.subject?.id || subject.id;
            const subjectName = subject.subject_id?.name || subject.subject?.name || subject.name || 'Unknown Subject';
            const subjectCode = subject.subject_id?.code || subject.subject?.code || '';
            const teacherName = subject.teacher_name || subject.teacher_details?.full_name || 'Not Assigned';
            const average = calculateSubjectAverage(subjectId);
            const gradeColor = getGradeColor(average);
            const subjectGrades = grades[subjectId] || [];

            return (
              <Grid item xs={12} md={6} key={subjectId || Math.random()}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': { 
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                  onClick={() => navigate(`/subject/${subjectId}`)}
                >
                  <CardContent>
                    {/* Subject Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <IconBook size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {subjectName}
                          </Typography>
                          {subjectCode && (
                            <Typography variant="caption" color="text.secondary">
                              {subjectCode}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {average && (
                        <Chip 
                          label={`${average}%`}
                          color={gradeColor}
                          size="small"
                        />
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Teacher Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <IconUser size={18} color="#666" />
                      <Typography variant="body2" color="text.secondary">
                        Teacher: {teacherName}
                      </Typography>
                    </Box>

                    {/* Performance */}
                    {average ? (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Average Performance
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subjectGrades.length} assessment{subjectGrades.length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(parseFloat(average), 100)} 
                          color={gradeColor}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          No grades recorded yet
                        </Typography>
                      </Box>
                    )}

                    {/* Quick Stats */}
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <IconClipboardList size={16} color="#666" />
                          <Typography variant="caption" display="block" color="text.secondary">
                            Assignments
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {subject.assignments_count || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <IconTrophy size={16} color="#666" />
                          <Typography variant="caption" display="block" color="text.secondary">
                            Grade
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {average ? `${average}%` : 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
