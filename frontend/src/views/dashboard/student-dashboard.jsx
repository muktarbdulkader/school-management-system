import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { Box, Typography, useTheme, Card, CardContent, IconButton, Rating, Stack, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress } from '@mui/material';
import {
  IconBook, IconCalendar, IconClipboardList, IconBell, IconFileText, IconStar
} from '@tabler/icons-react';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import DailyLessonPlans from './components/common/lesson-plans';
import ExamsAndResults from './components/common/exams-results';
import { gridSpacing } from 'store/constant';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import { toast } from 'react-toastify';

const CATEGORIES = [
  { value: 'teaching_quality', label: 'Teaching Quality' },
  { value: 'punctuality', label: 'Punctuality' },
  { value: 'communication', label: 'Communication' },
  { value: 'classroom_management', label: 'Classroom Management' },
  { value: 'student_engagement', label: 'Student Engagement' },
  { value: 'professionalism', label: 'Professionalism' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'innovation', label: 'Innovation' },
];

const StudentDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    enrolled_subjects: 0,
    total_assignments: 0,
    pending_assignments: 0,
    announcements: 0,
  });
  const [schedule, setSchedule] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [ratingDialog, setRatingDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [category, setCategory] = useState('teaching_quality');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);



  const openRating = (teacher) => {
    setSelectedTeacher(teacher);
    setRatingValue(0);
    setCategory('teaching_quality'); // Use valid default category
    setComment('');
    setRatingDialog(true);
  };

  const submitRating = async () => {
    if (!ratingValue) { toast.warning('Please select a rating'); return; }
    if (!selectedTeacher?.teacher_id) { toast.error('Teacher not selected'); return; }

    setSubmitting(true);
    try {
      const token = await GetToken();
      const ratingData = {
        teacher: selectedTeacher.teacher_id,
        rating: ratingValue,
        category,
        comment: comment || ''
      };

      console.log('Submitting rating:', ratingData);

      const res = await fetch(`${Backend.api}${Backend.teacherRatings}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData),
      });

      const data = await res.json();
      console.log('Rating submission response:', data);

      if (res.ok && (data.success || res.status === 201)) {
        toast.success('Rating submitted successfully');
        setRatingDialog(false);
        fetchTeachers();
      } else {
        console.error('Rating submission failed:', data);
        const errorMessage = data.errors ?
          Object.values(data.errors).flat().join(', ') :
          data.message || 'Failed to submit rating';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Error submitting rating');
    } finally {
      setSubmitting(false);
    }
  };

  const [lessonPlans, setLessonPlans] = useState([]);
  const [exams, setExams] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [assignmentGrades, setAssignmentGrades] = useState([]);

  const fetchStudentData = async () => {
    setLoading(true);
    const token = await GetToken();

    try {
      // 1. Get current student ID
      const profileRes = await fetch(`${Backend.api}${Backend.studentMe}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();
      const studentId = profileData.data?.id || profileData.id;
      
      // 2. Fetch consolidated dashboard data
      const dashboardRes = await fetch(`${Backend.api}parent_students/dashboard/${studentId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!dashboardRes.ok) throw new Error('Failed to fetch dashboard data');
      const dashboard = await dashboardRes.json();
      const data = dashboard.data;

      // 3. Update state
      setSchedule(data.schedule || []);
      setAssignments(data.upcoming_assignments || []);
      setAnnouncements(data.announcements || []);
      setLessonPlans(data.lesson_plans || []);
      setExams(data.exams || []);
      setExamResults(data.exam_results || []);
      setAssignmentGrades(data.assignment_grades || []);
      setTeachers((data.teachers || []).slice(0, 6));
      
      setStats({
        enrolled_subjects: data.schedule?.length || 0,
        total_assignments: data.upcoming_assignments?.length || 0,
        pending_assignments: (data.upcoming_assignments || []).filter(a => !a.is_submitted).length,
        announcements: data.announcements?.length || 0,
      });

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <DrogaCard>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <ActivityIndicator size={20} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              sx={{
                backgroundColor: color,
                padding: 1,
                ':hover': { backgroundColor: color },
              }}
            >
              <Icon size="1.4rem" stroke="1.8" color="white" />
            </IconButton>
            <Box sx={{ marginLeft: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h3" color={color}>
                  {value}
                </Typography>
                <Typography variant="subtitle1" color={color} sx={{ marginLeft: 0.6 }}>
                  {title}
                </Typography>
              </Box>
              <Typography variant="subtitle1" color={theme.palette.text.primary}>
                {subtitle}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </DrogaCard>
  );

  return (
    <PageContainer title="Student Dashboard">
      <Grid container spacing={gridSpacing} mt={1}>
        {/* Welcome Message */}
        <Grid item xs={12}>
          <DrogaCard>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h3" gutterBottom color={theme.palette.primary.main}>
                Welcome to MALD School Management System
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ mt: 1 }}>
                Student Portal
              </Typography>
            </Box>
          </DrogaCard>
        </Grid>

        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Subjects"
            value={stats.enrolled_subjects}
            icon={IconBook}
            color={theme.palette.primary.main}
            subtitle="Enrolled Subjects"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assignments"
            value={stats.total_assignments}
            icon={IconClipboardList}
            color={theme.palette.success.main}
            subtitle="Total Assignments"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pending_assignments}
            icon={IconFileText}
            color={theme.palette.warning.main}
            subtitle="Pending Submissions"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Announcements"
            value={stats.announcements}
            icon={IconBell}
            color={theme.palette.error.main}
            subtitle="New Announcements"
          />
        </Grid>

        {/* Today's Schedule */}
        <Grid item xs={12} md={6}>
          <DrogaCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">Today's Schedule</Typography>
              <IconButton onClick={() => navigate('/schedule')}>
                <IconCalendar />
              </IconButton>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <ActivityIndicator size={24} />
              </Box>
            ) : schedule.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No classes scheduled for today
              </Typography>
            ) : (
              <Box>
                {schedule.map((slot, index) => (
                  <Card key={index} sx={{ mb: 1, bgcolor: theme.palette.background.default }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {slot.subject?.name || slot.subject_details?.name || slot.subject || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {slot.teacher_details?.teacher_id?.user?.full_name ||
                              slot.teacher_id ||
                              'No teacher assigned'}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="primary">
                          {slot.start_time} - {slot.end_time}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </DrogaCard>
        </Grid>

        {/* Recent Assignments */}
        <Grid item xs={12} md={6}>
          <DrogaCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">Recent Assignments</Typography>
              <IconButton onClick={() => navigate('/assignments')}>
                <IconClipboardList />
              </IconButton>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <ActivityIndicator size={24} />
              </Box>
            ) : assignments.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No assignments yet
              </Typography>
            ) : (
              <Box>
                {assignments.map((assignment, index) => (
                  <Card key={index} sx={{ mb: 1, bgcolor: theme.palette.background.default }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {assignment.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment.subject_id?.name || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="error">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </DrogaCard>
        </Grid>

        {/* Recent Announcements */}
        <Grid item xs={12}>
          <DrogaCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">Recent Announcements</Typography>
              <IconButton onClick={() => navigate('/announcements')}>
                <IconBell />
              </IconButton>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <ActivityIndicator size={24} />
              </Box>
            ) : announcements.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No announcements
              </Typography>
            ) : (
              <Box>
                {announcements.map((announcement, index) => (
                  <Card key={index} sx={{ mb: 1, bgcolor: announcement.is_urgent ? theme.palette.error.light : theme.palette.background.default }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {announcement.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {announcement.message}
                          </Typography>
                        </Box>
                        {announcement.is_urgent && (
                          <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                            URGENT
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </DrogaCard>
        </Grid>

        {/* Daily Lesson Plans - Added as per SRS Section 2 */}
        <Grid item xs={12}>
           <DailyLessonPlans lessonPlans={lessonPlans} />
        </Grid>

        {/* Exams and Results */}
        <Grid item xs={12}>
           <ExamsAndResults exams={exams} results={examResults} assignments={assignmentGrades} />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <DrogaCard>
            <Typography variant="h4" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={2}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    py: 2,
                    '&:hover': { bgcolor: theme.palette.primary.light }
                  }}
                  onClick={() => navigate('/my-subjects')}
                >
                  <IconBook size={32} color={theme.palette.primary.main} />
                  <Typography variant="body2" sx={{ mt: 1 }}>My Classes</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    py: 2,
                    '&:hover': { bgcolor: theme.palette.primary.light }
                  }}
                  onClick={() => navigate('/assignments')}
                >
                  <IconClipboardList size={32} color={theme.palette.success.main} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Assignments</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    py: 2,
                    '&:hover': { bgcolor: theme.palette.primary.light }
                  }}
                  onClick={() => navigate('/schedule')}
                >
                  <IconCalendar size={32} color={theme.palette.info.main} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Schedule</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    py: 2,
                    '&:hover': { bgcolor: theme.palette.primary.light }
                  }}
                  onClick={() => navigate('/library')}
                >
                  <IconBook size={32} color={theme.palette.warning.main} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Library</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    py: 2,
                    '&:hover': { bgcolor: theme.palette.primary.light }
                  }}
                  onClick={() => navigate('/blog')}
                >
                  <IconFileText size={32} color={theme.palette.secondary.main} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Blog</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card
                  sx={{ cursor: 'pointer', textAlign: 'center', py: 2, '&:hover': { bgcolor: theme.palette.primary.light } }}
                  onClick={() => navigate('/announcements')}
                >
                  <IconBell size={32} color={theme.palette.error.main} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Announcements</Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card
                  sx={{ cursor: 'pointer', textAlign: 'center', py: 2, '&:hover': { bgcolor: theme.palette.warning.light } }}
                  onClick={() => navigate('/teacher-ratings')}
                >
                  <IconStar size={32} color={theme.palette.warning.main} />
                  <Typography variant="body2" sx={{ mt: 1 }}>Rate Teachers</Typography>
                </Card>
              </Grid>
            </Grid>
          </DrogaCard>
        </Grid>

        {/* Rate Your Teachers — inline section */}
        <Grid item xs={12}>
          <DrogaCard>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h4">Rate Your Teachers</Typography>
                <Typography variant="body2" color="text.secondary">Share feedback to help improve teaching quality</Typography>
              </Box>
              <Button size="small" onClick={() => navigate('/teacher-ratings')}>View All</Button>
            </Stack>
            <Grid container spacing={2}>
              {teachers.length === 0 ? (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No teachers available. Make sure you are enrolled in subjects.
                  </Typography>
                </Grid>
              ) : teachers.map((t, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ p: 1.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: 16 }}>
                        {(t.full_name || t.user?.full_name || 'T')[0]}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>{t.full_name || t.user?.full_name || '—'}</Typography>
                        <Rating value={t.rating || 0} readOnly size="small" precision={0.5} />
                      </Box>
                      <Button size="small" variant="outlined" onClick={() => openRating(t)}>Rate</Button>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DrogaCard>
        </Grid>
      </Grid>

      {/* Rating Dialog */}
      <Dialog open={ratingDialog} onClose={() => setRatingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rate — {selectedTeacher?.full_name || selectedTeacher?.user?.full_name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Category" value={category} onChange={e => setCategory(e.target.value)} fullWidth>
              {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </TextField>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Your Rating</Typography>
              <Rating value={ratingValue} onChange={(_, v) => setRatingValue(v)} size="large" />
            </Box>
            <TextField label="Comment (optional)" multiline rows={3} fullWidth value={comment} onChange={e => setComment(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitRating} disabled={submitting || !ratingValue}>
            {submitting ? <CircularProgress size={18} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default StudentDashboard;
