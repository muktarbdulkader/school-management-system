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

// Exam type color mapping - handles both backend formats
const getExamTypeConfig = (type) => {
  // Debug: log the actual type value received
  // console.log('[ExamType] Received type:', type);

  const configs = {
    // Backend format (snake_case)
    mid_term: { color: '#ff9800', bgColor: '#fff3e0', label: 'Mid Term', icon: IconSchool },
    diagnostic_test: { color: '#9c27b0', bgColor: '#f3e5f5', label: 'Diagnostic', icon: IconTrendingUp },
    unit_test: { color: '#2196f3', bgColor: '#e3f2fd', label: 'Quiz', icon: IconClipboardCheck },
    final: { color: '#f44336', bgColor: '#ffebee', label: 'Final', icon: IconSchool },
    // Frontend format (PascalCase/title case from Grade form)
    Midterm: { color: '#ff9800', bgColor: '#fff3e0', label: 'Mid Term', icon: IconSchool },
    'Mid Term': { color: '#ff9800', bgColor: '#fff3e0', label: 'Mid Term', icon: IconSchool },
    midterm: { color: '#ff9800', bgColor: '#fff3e0', label: 'Mid Term', icon: IconSchool },
    'mid term': { color: '#ff9800', bgColor: '#fff3e0', label: 'Mid Term', icon: IconSchool },
    Final: { color: '#f44336', bgColor: '#ffebee', label: 'Final', icon: IconSchool },
    final: { color: '#f44336', bgColor: '#ffebee', label: 'Final', icon: IconSchool },
    Quiz: { color: '#2196f3', bgColor: '#e3f2fd', label: 'Quiz', icon: IconClipboardCheck },
    quiz: { color: '#2196f3', bgColor: '#e3f2fd', label: 'Quiz', icon: IconClipboardCheck },
    Assignment: { color: '#8bc34a', bgColor: '#f1f8e9', label: 'Assignment', icon: IconClipboardCheck },
    assignment: { color: '#8bc34a', bgColor: '#f1f8e9', label: 'Assignment', icon: IconClipboardCheck },
    Project: { color: '#9c27b0', bgColor: '#f3e5f5', label: 'Project', icon: IconTrendingUp },
    project: { color: '#9c27b0', bgColor: '#f3e5f5', label: 'Project', icon: IconTrendingUp },
    Diagnostic: { color: '#9c27b0', bgColor: '#f3e5f5', label: 'Diagnostic', icon: IconTrendingUp },
    diagnostic: { color: '#9c27b0', bgColor: '#f3e5f5', label: 'Diagnostic', icon: IconTrendingUp },
    // Handle null/undefined
    null: { color: '#757575', bgColor: '#f5f5f5', label: 'Exam', icon: IconBook },
    undefined: { color: '#757575', bgColor: '#f5f5f5', label: 'Exam', icon: IconBook },
    '': { color: '#757575', bgColor: '#f5f5f5', label: 'Exam', icon: IconBook },
    other: { color: '#757575', bgColor: '#f5f5f5', label: 'Other', icon: IconBook }
  };

  if (!type || type === 'null' || type === 'undefined') {
    return configs.null;
  }

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

// Get grade display config for report card grades
const getReportCardGradeConfig = (grade) => {
  const configs = {
    'EX': { color: '#4caf50', bgColor: '#e8f5e9', label: 'Excellent' },
    'VG': { color: '#8bc34a', bgColor: '#f1f8e9', label: 'Very Good' },
    'G': { color: '#ffc107', bgColor: '#fff8e1', label: 'Good' },
    'S': { color: '#ff9800', bgColor: '#fff3e0', label: 'Satisfactory' },
    'NI': { color: '#f44336', bgColor: '#ffebee', label: 'Needs Improvement' },
    'U': { color: '#d32f2f', bgColor: '#ffcdd2', label: 'Unsatisfactory' },
    'A': { color: '#4caf50', bgColor: '#e8f5e9', label: 'Excellent' },
    'B': { color: '#8bc34a', bgColor: '#f1f8e9', label: 'Very Good' },
    'C': { color: '#ffc107', bgColor: '#fff8e1', label: 'Good' },
    'D': { color: '#ff9800', bgColor: '#fff3e0', label: 'Passing' },
    'E': { color: '#f44336', bgColor: '#ffebee', label: 'Needs Improvement' },
    'F': { color: '#d32f2f', bgColor: '#ffcdd2', label: 'Fail' },
  };
  return configs[grade] || { color: '#757575', bgColor: '#f5f5f5', label: grade };
};

const ExamsAndResults = ({ exams, results, assignments, reportCard }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Report Card Summary - Show if available */}
      {reportCard && reportCard.subjects && reportCard.subjects.length > 0 && (
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.04)',
              mb: 2
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: '#e8f5e9',
                      color: '#4caf50',
                      width: 48,
                      height: 48
                    }}
                  >
                    <IconReportAnalytics size={24} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="700" color="text.primary">
                      Current Term Grades
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Auto-calculated from Exams (70%), Assignments (20%), Attendance (10%)
                    </Typography>
                  </Box>
                </Box>
                {reportCard.overall_percentage && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {reportCard.overall_percentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Overall Score
                    </Typography>
                  </Box>
                )}
              </Box>

              <Stack spacing={2}>
                {reportCard.subjects.slice(0, 4).map((subject) => {
                  const gradeConfig = getReportCardGradeConfig(subject.descriptive_grade || subject.letter_grade);
                  return (
                    <Paper
                      key={subject.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              <IconBook size={16} />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="600" noWrap>
                                {subject.subject_details?.name || subject.subject}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Tooltip title={`Exam: ${subject.exam_score?.toFixed(1) || 0}% (70% weight)`}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">Exam</Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(subject.exam_score || 0, 100)}
                                  sx={{
                                    height: 6,
                                    borderRadius: 1,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: subject.exam_score >= 60 ? '#4caf50' : '#f44336',
                                    }
                                  }}
                                />
                              </Box>
                            </Tooltip>
                            <Tooltip title={`Assignment: ${subject.assignment_avg?.toFixed(1) || 0}% (20% weight)`}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">Assign</Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(subject.assignment_avg || 0, 100)}
                                  sx={{
                                    height: 6,
                                    borderRadius: 1,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: subject.assignment_avg >= 60 ? '#8bc34a' : '#ff9800',
                                    }
                                  }}
                                />
                              </Box>
                            </Tooltip>
                            <Tooltip title={`Attendance: ${subject.attendance_score?.toFixed(1) || 0}% (10% weight)`}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">Attend</Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(subject.attendance_score || 0, 100)}
                                  sx={{
                                    height: 6,
                                    borderRadius: 1,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: subject.attendance_score >= 60 ? '#2196f3' : '#ff9800',
                                    }
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h6" fontWeight="bold" color={gradeConfig.color}>
                                {subject.total_score?.toFixed(1) || 0}%
                              </Typography>
                            </Box>
                            <Chip
                              label={subject.descriptive_grade || subject.letter_grade || '-'}
                              size="small"
                              sx={{
                                bgcolor: gradeConfig.bgColor,
                                color: gradeConfig.color,
                                fontWeight: 700,
                                minWidth: 45
                              }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>

              {reportCard.subjects.length > 4 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    +{reportCard.subjects.length - 4} more subjects - View full report card for details
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

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

      {/* Exam Results - Grouped by Subject with Mid/Final breakdown */}
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
                  {results?.length || 0} results by subject
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
                  Mid-term and Final results will appear here after teacher grading
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {/* Group results by subject */}
                {Object.entries(
                  results.reduce((acc, result) => {
                    const subjectName = result.subject_details?.name || result.subject_id_name || result.subject?.name || 'Unknown';
                    if (!acc[subjectName]) acc[subjectName] = [];
                    acc[subjectName].push(result);
                    return acc;
                  }, {})
                ).map(([subjectName, subjectResults]) => {
                  // Calculate subject total
                  const totalScore = subjectResults.reduce((sum, r) => sum + (r.score || 0), 0);
                  const totalMax = subjectResults.reduce((sum, r) => sum + (r.max_score || 100), 0);
                  const subjectPercentage = (totalScore / totalMax) * 100;
                  const subjectGrade = getGradeConfig(totalScore, totalMax);

                  return (
                    <Paper
                      key={subjectName}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {/* Subject Header with Total */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <IconBook size={16} />
                          </Avatar>
                          <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                            {subjectName}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" fontWeight="bold" color={subjectGrade.color}>
                            {subjectPercentage.toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subjectResults.length} exam{subjectResults.length > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Individual Exam Results */}
                      <Stack spacing={1}>
                        {subjectResults.map((result) => {
                          const examType = result.exam_details?.exam_type || 'other';
                          const typeConfig = getExamTypeConfig(examType);
                          const percentage = (result.score / result.max_score) * 100;

                          // Debug: log the actual exam type received
                          // console.log('[ExamResult] exam_details:', result.exam_details, 'exam_type:', examType);

                          return (
                            <Box
                              key={result.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'grey.50',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Tooltip title={`Type: ${examType || 'N/A'}`}>
                                  <Chip
                                    label={typeConfig.label}
                                    size="small"
                                    sx={{
                                      bgcolor: typeConfig.bgColor,
                                      color: typeConfig.color,
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      height: 22,
                                      minWidth: 70,
                                      cursor: 'help'
                                    }}
                                  />
                                </Tooltip>
                                <Typography variant="body2" color="text.secondary">
                                  {result.exam_details?.name}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="600" color={percentage >= 60 ? 'success.main' : 'error.main'}>
                                  {result.score}/{result.max_score}
                                </Typography>
                                <Typography variant="caption" color={percentage >= 60 ? 'success.main' : 'error.main'}>
                                  ({percentage.toFixed(1)}%)
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>

                      {/* Subject Total Progress */}
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(subjectPercentage, 100)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: subjectGrade.color,
                              borderRadius: 3
                            }
                          }}
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
