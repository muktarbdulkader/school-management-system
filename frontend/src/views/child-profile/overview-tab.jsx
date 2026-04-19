import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress as MuiCircularProgress,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import { AccessTime, School, Assignment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Fallbacks from 'utils/components/Fallbacks';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import { getStatusColor } from 'utils/function';

export default function OverviewTab({
  data,
  academicLoading = false,
  academicError = null,
  attendanceLoading = false,
  attendanceError = null,
  assignmentsLoading = false,
  assignmentsError = null,
  userRole = 'parent',
  studentId,
}) {
  const navigate = useNavigate();
  const isTeacher = userRole === 'teacher';

  const getBehaviorColor = (rating) => {
    if (rating >= 85) return 'success.main';
    if (rating >= 70) return 'warning.main';
    return 'error.main';
  };

  return (
    <Grid container spacing={3}>
      {/* Academic Overview */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <School />
              </Avatar>
              <Typography variant="h5" fontWeight="600">
                Academic Overview
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            {academicLoading ? (
              <Box
                sx={{ display: 'flex', justifyContent: 'center', height: 120 }}
              >
                <MuiCircularProgress />
              </Box>
            ) : academicError ? (
              <ErrorPrompt
                title="Error Loading Academic Overview"
                message={
                  academicError.message ||
                  'Unable to load academic overview data'
                }
                size={100}
              />
            ) : !data?.grade && !data?.behavior_ratings ? (
              <Fallbacks
                severity="info"
                title="No Academic Data"
                description="There is no academic overview data to display."
                size={100}
              />
            ) : (
              <Grid container spacing={3}>
                {/* Current Grade */}
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Current Grade
                    </Typography>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'primary.light',
                        borderRadius: '50%',
                      }}
                    >
                      <Typography
                        variant="h3"
                        fontWeight="bold"
                        color="primary.dark"
                      >
                        {data.student?.grade || data.grade || 'N/A'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Student ID: {data.student?.student_id || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Behavior Rating */}
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Behavior Rating
                    </Typography>
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        mb: 1,
                      }}
                    >
                      <MuiCircularProgress
                        variant="determinate"
                        value={data.behavior_ratings?.average_rating || 0}
                        size={80}
                        thickness={6}
                        sx={{
                          color: getBehaviorColor(
                            data.behavior_ratings?.average_rating || 0,
                          ),
                        }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography
                          variant="h5"
                          component="div"
                          fontWeight="bold"
                        >
                          {data.behavior_ratings?.average_rating || 'N/A'}%
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={
                        (data.behavior_ratings?.average_rating || 0) >= 85
                          ? 'Excellent'
                          : (data.behavior_ratings?.average_rating || 0) >= 70
                            ? 'Good'
                            : 'Needs Improvement'
                      }
                      size="small"
                      sx={{
                        bgcolor: getBehaviorColor(
                          data.behavior_ratings?.average_rating || 0,
                        ),
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            )}

            <Button
              fullWidth
              variant="text"
              size="small"
              sx={{ mt: 3, color: 'primary.main' }}
            >
              View Full Academic Report
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Attendance */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <AccessTime />
              </Avatar>
              <Typography variant="h5" fontWeight="600">
                Attendance
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            {attendanceLoading ? (
              <Box
                sx={{ display: 'flex', justifyContent: 'center', height: 120 }}
              >
                <MuiCircularProgress />
              </Box>
            ) : attendanceError ? (
              <ErrorPrompt
                title="Error Loading Attendance"
                message={
                  attendanceError.message || 'Unable to load attendance data'
                }
                size={100}
              />
            ) : !data?.attendance ? (
              <Fallbacks
                severity="info"
                title="No Attendance Data"
                description="There is no attendance data to display."
                size={100}
              />
            ) : (
              <Grid container spacing={2}>
                {/* Today's Status */}
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Today's Status
                    </Typography>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        mx: 'auto',
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'success.light',
                        borderRadius: '50%',
                      }}
                    >
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color="success.dark"
                      >
                        ✓
                      </Typography>
                    </Box>
                    <Typography variant="body2">Present</Typography>
                  </Box>
                </Grid>

                {/* Overall Attendance */}
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Overall Attendance
                    </Typography>
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        mb: 1,
                      }}
                    >
                      <MuiCircularProgress
                        variant="determinate"
                        value={data.attendance?.summary?.percentage || 0}
                        size={60}
                        thickness={6}
                        sx={{ color: 'success.main' }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography
                          variant="body1"
                          component="div"
                          fontWeight="bold"
                        >
                          {data.attendance?.summary?.percentage || 'N/A'}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2">
                      Present: {data.attendance?.summary?.present || 0} / {data.attendance?.summary?.total || 0} days
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}

            <Button
              fullWidth
              variant="text"
              size="small"
              sx={{ mt: 3, color: 'primary.main' }}
            >
              View Attendance Details
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Upcoming Assignments */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <Assignment />
              </Avatar>
              <Typography variant="h5" fontWeight="600">
                Upcoming Assignments
              </Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            {assignmentsLoading ? (
              <Box
                sx={{ display: 'flex', justifyContent: 'center', height: 120 }}
              >
                <MuiCircularProgress />
              </Box>
            ) : assignmentsError ? (
              <ErrorPrompt
                title="Error Loading Assignments"
                message={
                  assignmentsError.message ||
                  'Unable to load upcoming assignments'
                }
                size={100}
              />
            ) : !data?.upcoming_assignments?.length ? (
              <Fallbacks
                severity="info"
                title="No Assignments"
                description="There are no upcoming assignments to display."
                size={100}
              />
            ) : (
              <Box sx={{ display: 'grid', gap: 2 }}>
                {data.upcoming_assignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      '&:hover': {
                        boxShadow: 1,
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {assignment.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Due: {assignment.due_date}
                        </Typography>
                      </Box>
                      <Chip
                        label={assignment.status}
                        size="small"
                        sx={{
                          ...getStatusColor(assignment.status),
                          fontWeight: 500,
                          minWidth: 80,
                        }}
                      />
                    </Box>
                  </Card>
                ))}
              </Box>
            )}

            <Button
              fullWidth
              variant="text"
              size="small"
              sx={{ mt: 2, color: 'primary.main' }}
            >
              View All Assignments
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Teacher-Only: Assignment Submissions & Learning Progress */}
      {isTeacher && (
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, bgcolor: 'info.light' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Avatar sx={{ bgcolor: 'info.dark' }}>
                  <Assignment />
                </Avatar>
                <Typography variant="h5" fontWeight="600">
                  Teacher View: Assignment Submissions & Progress
                </Typography>
              </Stack>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                {/* Section & Subject Info */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Class Information
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        Grade: {data?.grade || 'N/A'}
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        Section: {data?.section || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Enrolled Subjects: {data?.enrolled_subjects_count || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Assignment Submission Status */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Recent Submissions
                      </Typography>
                      <Typography variant="body1">
                        Total Assignments: {data?.assignments?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Submitted: {data?.assignments?.filter(a => a.status === 'submitted' || a.status === 'completed')?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="warning.main">
                        Pending: {data?.assignments?.filter(a => a.status === 'pending' || a.status === 'assigned')?.length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Learning Progress */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Learning Progress
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {data?.progress?.overall_average || data?.behavior_ratings?.average_rating || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Overall Average
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Based on assignments and assessments
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Subject-wise Progress for Teachers */}
                {data?.progress?.subject_progress && Object.keys(data.progress.subject_progress).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
                      Subject-wise Learning Progress
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(data.progress.subject_progress).map(([subject, grades]) => {
                        const avg = grades.length > 0
                          ? grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length
                          : 0;
                        return (
                          <Chip
                            key={subject}
                            label={`${subject}: ${avg.toFixed(1)}%`}
                            size="small"
                            color={avg >= 70 ? 'success' : avg >= 50 ? 'warning' : 'error'}
                            variant="outlined"
                          />
                        );
                      })}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
}
