import React from 'react';
import {
  Card, CardContent, Typography, Box, Chip, Grid, Stack,
  LinearProgress, Avatar, Paper, Badge, Tooltip
} from '@mui/material';
import {
  IconReportAnalytics, IconCalendarEvent, IconClipboardCheck,
  IconClock, IconBook, IconTrendingUp, IconTrendingDown,
  IconEqual, IconSchool
} from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';

// Exam type color mapping
const getExamTypeConfig = (type) => {
  const configs = {
    mid_term: { color: '#ff9800', bgColor: '#fff3e0', label: 'Mid Term', icon: IconSchool },
    diagnostic_test: { color: '#9c27b0', bgColor: '#f3e5f5', label: 'Diagnostic', icon: IconTrendingUp },
    unit_test: { color: '#2196f3', bgColor: '#e3f2fd', label: 'Quiz', icon: IconClipboardCheck },
    final: { color: '#f44336', bgColor: '#ffebee', label: 'Final', icon: IconSchool },
    other: { color: '#757575', bgColor: '#f5f5f5', label: 'Other', icon: IconBook }
  };
  return configs[type] || configs.other;
};

// Get grade letter and color based on percentage
const getGradeConfig = (score, maxScore) => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return { letter: 'A', color: '#4caf50', bgColor: '#e8f5e9', label: 'Excellent' };
  if (percentage >= 80) return { letter: 'B', color: '#8bc34a', bgColor: '#f1f8e9', label: 'Very Good' };
  if (percentage >= 70) return { letter: 'C', color: '#ffc107', bgColor: '#fff8e1', label: 'Good' };
  if (percentage >= 60) return { letter: 'D', color: '#ff9800', bgColor: '#fff3e0', label: 'Average' };
  return { letter: 'F', color: '#f44336', bgColor: '#ffebee', label: 'Needs Improvement' };
};

// Calculate days until exam
const getDaysUntil = (dateString) => {
  const examDate = new Date(dateString);
  const today = new Date();
  const diffTime = examDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const ExamsAndResults = ({ exams, results, assignments }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Upcoming Exams */}
      <Grid item xs={12} md={4}>
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.04)'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: '#ffebee',
                  color: '#f44336',
                  width: 44,
                  height: 44
                }}
              >
                <IconCalendarEvent size={24} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700" color="text.primary">
                  Upcoming Exams
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {exams?.length || 0} exams scheduled
                </Typography>
              </Box>
            </Box>

            {!exams || exams.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '2px dashed',
                  borderColor: 'grey.200'
                }}
              >
                <IconCalendarEvent size={40} color="#bdbdbd" style={{ marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary">
                  No upcoming exams
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Enjoy your free time!
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {exams.map((exam) => {
                  const typeConfig = getExamTypeConfig(exam.exam_type || exam.type);
                  const daysUntil = getDaysUntil(exam.start_date);
                  const TypeIcon = typeConfig.icon;

                  return (
                    <Paper
                      key={exam.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                          <Avatar
                            sx={{
                              bgcolor: typeConfig.bgColor,
                              color: typeConfig.color,
                              width: 32,
                              height: 32
                            }}
                          >
                            <TypeIcon size={16} />
                          </Avatar>
                          <Typography
                            variant="subtitle1"
                            fontWeight="600"
                            noWrap
                            sx={{ flex: 1, color: 'text.primary' }}
                          >
                            {exam.name}
                          </Typography>
                        </Box>
                        <Tooltip title={typeConfig.label}>
                          <Chip
                            label={typeConfig.label}
                            size="small"
                            sx={{
                              bgcolor: typeConfig.bgColor,
                              color: typeConfig.color,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 22,
                              ml: 1
                            }}
                          />
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <IconBook size={14} color={theme.palette.text.secondary} />
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          {exam.subject || exam.subject_details?.name || 'N/A'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconClock size={14} color={theme.palette.primary.main} />
                          <Typography variant="caption" color="primary" fontWeight={600}>
                            {new Date(exam.start_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                            {(exam.start_time || exam.end_time) && (
                              <span> • {exam.start_time?.substring(0, 5) || '--:--'}</span>
                            )}
                          </Typography>
                        </Box>
                        <Badge
                          sx={{
                            '& .MuiBadge-badge': {
                              bgcolor: daysUntil <= 3 ? '#f44336' : daysUntil <= 7 ? '#ff9800' : '#4caf50',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              minWidth: 'auto',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }
                          }}
                          badgeContent={daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                        />
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Exam Results */}
      <Grid item xs={12} md={4}>
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.04)'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: '#e8f5e9',
                  color: '#4caf50',
                  width: 44,
                  height: 44
                }}
              >
                <IconReportAnalytics size={24} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700" color="text.primary">
                  Exam Results
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {results?.length || 0} results available
                </Typography>
              </Box>
            </Box>

            {!results || results.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '2px dashed',
                  borderColor: 'grey.200'
                }}
              >
                <IconReportAnalytics size={40} color="#bdbdbd" style={{ marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary">
                  No results yet
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Results will appear here after grading
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {results.map((result) => {
                  const gradeConfig = getGradeConfig(result.score, result.max_score);
                  const percentage = (result.score / result.max_score) * 100;

                  return (
                    <Paper
                      key={result.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="600"
                            color="text.primary"
                            noWrap
                          >
                            {result.subject_details?.name || result.subject_id_name || result.subject?.name || 'Subject'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {result.exam_name || 'Exam'}
                          </Typography>
                        </Box>
                        <Tooltip title={gradeConfig.label}>
                          <Avatar
                            sx={{
                              bgcolor: gradeConfig.bgColor,
                              color: gradeConfig.color,
                              width: 40,
                              height: 40,
                              fontWeight: 700,
                              fontSize: '1rem'
                            }}
                          >
                            {gradeConfig.letter}
                          </Avatar>
                        </Tooltip>
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="h4" fontWeight="700" color={gradeConfig.color}>
                            {result.score}
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                              / {result.max_score}
                            </Typography>
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color={gradeConfig.color}>
                            {percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'grey.100',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: gradeConfig.color,
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {percentage >= 80 ? (
                          <IconTrendingUp size={14} color="#4caf50" />
                        ) : percentage >= 60 ? (
                          <IconEqual size={14} color="#ff9800" />
                        ) : (
                          <IconTrendingDown size={14} color="#f44336" />
                        )}
                        <Typography
                          variant="caption"
                          color={percentage >= 60 ? 'success.main' : 'error.main'}
                          fontWeight={500}
                        >
                          {percentage >= 80 ? 'Excellent performance!' : percentage >= 60 ? 'Passing grade' : 'Needs improvement'}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Assignment Grades */}
      <Grid item xs={12} md={4}>
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.04)'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: '#e3f2fd',
                  color: '#2196f3',
                  width: 44,
                  height: 44
                }}
              >
                <IconClipboardCheck size={24} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700" color="text.primary">
                  Assignments
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {assignments?.length || 0} graded assignments
                </Typography>
              </Box>
            </Box>

            {!assignments || assignments.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '2px dashed',
                  borderColor: 'grey.200'
                }}
              >
                <IconClipboardCheck size={40} color="#bdbdbd" style={{ marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary">
                  No graded assignments
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Submit assignments to see grades
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {assignments.map((ass) => {
                  const gradeValue = ass.grade || ass.score || 0;
                  const gradeConfig = getGradeConfig(gradeValue, 100);

                  return (
                    <Paper
                      key={ass.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="600"
                            color="text.primary"
                            noWrap
                          >
                            {ass.assignment_details?.title || ass.title || 'Assignment'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <IconBook size={14} color={theme.palette.text.secondary} />
                            <Typography variant="caption" color="text.secondary">
                              {ass.assignment_details?.subject?.name || ass.subject?.name || 'Subject'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right', ml: 1 }}>
                          <Typography variant="h4" fontWeight="700" color={gradeConfig.color}>
                            {gradeValue}%
                          </Typography>
                          <Chip
                            label={gradeConfig.letter}
                            size="small"
                            sx={{
                              bgcolor: gradeConfig.bgColor,
                              color: gradeConfig.color,
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              height: 18,
                              mt: 0.5
                            }}
                          />
                        </Box>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={gradeValue}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'grey.100',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: gradeConfig.color,
                            borderRadius: 3
                          }
                        }}
                      />

                      {ass.submitted_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Submitted: {new Date(ass.submitted_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ExamsAndResults;
