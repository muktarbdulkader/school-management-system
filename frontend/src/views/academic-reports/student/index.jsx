import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Divider,
  Tooltip,
  Stack,
  Badge,
} from '@mui/material';
import {
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as MinusIcon,
  CheckCircle as CheckCircleIcon,
  MenuBook as MenuBookIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

const StudentAcademicReport = () => {
  const user = useSelector((state) => state?.user?.user);
  const [loading, setLoading] = useState(false);
  const [termsLoading, setTermsLoading] = useState(true);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  // Fetch student info and available terms
  useEffect(() => {
    fetchStudentInfo();
    fetchTerms();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      const token = await GetToken();
      console.log('[StudentReport] Fetching student info with token...');
      const res = await fetch(`${Backend.api}/students/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[StudentReport] Student info response status:', res.status);
      const data = await res.json();
      console.log('[StudentReport] Student info data:', data);
      if (data.success) {
        setStudentInfo(data.data);
      } else {
        // Fallback to user data from Redux
        console.log('[StudentReport] Using Redux user data as fallback');
        setStudentInfo({
          name: user?.first_name || user?.username || 'Student',
          ...user
        });
      }
    } catch (e) {
      console.error('[StudentReport] Failed to fetch student info:', e);
      // Fallback to user data from Redux
      setStudentInfo({
        name: user?.first_name || user?.username || 'Student',
        ...user
      });
    }
  };

  const fetchTerms = async () => {
    setTermsLoading(true);
    try {
      const token = await GetToken();
      const url = `${Backend.api}${Backend.terms}`;
      console.log('[StudentReport] Fetching terms from:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[StudentReport] Terms response status:', res.status);
      const data = await res.json();
      console.log('[StudentReport] Terms data:', data);
      if (data.success) {
        setTerms(data.data || []);
        const currentTerm = data.data?.find(t => t.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        }
      } else {
        console.error('[StudentReport] Terms API returned error:', data.message);
      }
    } catch (e) {
      console.error('[StudentReport] Failed to fetch terms:', e);
    } finally {
      setTermsLoading(false);
    }
  };

  // Fetch report card when term changes
  useEffect(() => {
    if (selectedTerm) {
      fetchReportCard();
    }
  }, [selectedTerm]);

  const fetchReportCard = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(
        `${Backend.api}report_cards/?term_id=${selectedTerm}&student_me=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setReportCard(data.data[0]);
      } else {
        setReportCard(null);
      }
    } catch (e) {
      console.error('Failed to fetch report card:', e);
      setReportCard(null);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'EX': '#4caf50', 'A': '#4caf50',
      'VG': '#8bc34a', 'B': '#8bc34a',
      'G': '#ffc107', 'C': '#ffc107',
      'S': '#ff9800', 'D': '#ff9800',
      'NI': '#f44336', 'E': '#f44336',
      'U': '#d32f2f', 'F': '#d32f2f',
    };
    return colors[grade] || '#757575';
  };

  const getGradeLabel = (grade) => {
    const labels = {
      'EX': 'Excellent', 'A': 'Excellent',
      'VG': 'Very Good', 'B': 'Very Good',
      'G': 'Good', 'C': 'Good',
      'S': 'Satisfactory', 'D': 'Satisfactory',
      'NI': 'Needs Improvement', 'E': 'Needs Improvement',
      'U': 'Unsatisfactory', 'F': 'Fail',
    };
    return labels[grade] || grade;
  };

  const getPerformanceIcon = (percentage) => {
    if (percentage >= 80) return <TrendingUpIcon sx={{ color: '#4caf50' }} />;
    if (percentage >= 60) return <MinusIcon sx={{ color: '#ff9800' }} />;
    return <TrendingDownIcon sx={{ color: '#f44336' }} />;
  };

  const getComponentBarColor = (value, max = 100) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#ff9800';
    return '#f44336';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <SchoolIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            My Academic Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {studentInfo?.name ? `${studentInfo.name} | Grade ${studentInfo.grade_details?.grade || ''} ${studentInfo.section_details?.name || ''}` : (termsLoading ? 'Loading...' : 'Student')}
          </Typography>
        </Box>
      </Box>

      {/* Term Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth sx={{ maxWidth: 300 }} disabled={termsLoading}>
            <InputLabel>{termsLoading ? 'Loading terms...' : 'Select Term'}</InputLabel>
            <Select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              label={termsLoading ? 'Loading terms...' : 'Select Term'}
            >
              {terms.map((term) => (
                <MenuItem key={term.id} value={term.id}>
                  {term.name} {term.is_current && <Chip size="small" label="Current" color="primary" sx={{ ml: 1 }} />}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {terms.length === 0 && !termsLoading && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No terms available. Please contact your administrator.
            </Alert>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : reportCard ? (
        <>
          {/* Overall Summary Card */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" fontWeight="bold">
                      {reportCard.overall_percentage?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body1">Overall Score</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      label={reportCard.subjects?.[0]?.descriptive_grade || reportCard.subjects?.[0]?.letter_grade || 'N/A'}
                      sx={{
                        backgroundColor: 'white',
                        color: getGradeColor(reportCard.subjects?.[0]?.descriptive_grade || reportCard.subjects?.[0]?.letter_grade),
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        py: 1,
                        px: 2,
                      }}
                    />
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {getGradeLabel(reportCard.subjects?.[0]?.descriptive_grade || reportCard.subjects?.[0]?.letter_grade)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" fontWeight="bold">
                      #{reportCard.rank_in_class || '-'}
                    </Typography>
                    <Typography variant="body1">
                      of {reportCard.total_students || '-'} Students
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" fontWeight="bold">
                      {reportCard.subjects?.length || 0}
                    </Typography>
                    <Typography variant="body1">Subjects</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Subject Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon /> Subject Performance Breakdown
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                {/* <Typography variant="body2">
                  <strong>How your grade is calculated:</strong> Your teachers can customize weights for each component.
                  The system only includes components they have entered (Exam, CA, Assignment, Attendance).
                  If a component shows "-", your teacher hasn't entered it yet, and the remaining components are weighted proportionally.
                </Typography> */}
              </Alert>

              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Subject</strong></TableCell>
                      <TableCell align="center"><strong>Exam (60%)</strong></TableCell>
                      <TableCell align="center"><strong>C.A. (20%)</strong></TableCell>
                      <TableCell align="center"><strong>Assignment (10%)</strong></TableCell>
                      <TableCell align="center"><strong>Attendance (10%)</strong></TableCell>
                      <TableCell align="center"><strong>Total</strong></TableCell>
                      <TableCell align="center"><strong>Grade</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportCard.subjects?.map((subject, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              <MenuBookIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {subject.subject_details?.name || subject.subject}
                              </Typography>
                              {subject.teacher_comment && (
                                <Typography variant="caption" color="text.secondary">
                                  "{subject.teacher_comment}"
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        {/* Exam Score */}
                        <TableCell align="center">
                          <Tooltip title={subject.exam_types?.length > 0
                            ? `Exams: ${subject.exam_types.map(e => `${e.type}: ${e.score.toFixed(1)}%`).join(', ')}`
                            : `Exam Score: ${subject.exam_score?.toFixed(1) || 0}% (out of ${subject.exam_max_score || 100})`}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(subject.exam_score || 0, 100)}
                                  sx={{
                                    width: 60,
                                    height: 8,
                                    borderRadius: 1,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: getComponentBarColor(subject.exam_score || 0),
                                      borderRadius: 1,
                                    }
                                  }}
                                />
                                <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 45 }}>
                                  {subject.exam_score?.toFixed(1) || 0}%
                                </Typography>
                              </Box>
                              {subject.exam_types?.length > 0 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                  {subject.exam_types.map((e, idx) => (
                                    <Typography key={idx} variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                      {e.type}: {e.raw_score?.toFixed(0) || e.score?.toFixed(0)}/{e.max_score?.toFixed(0) || 100}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        {/* CA Score */}
                        <TableCell align="center">
                          <Tooltip title={`Continuous Assessment: ${subject.ca_score?.toFixed(1) || 0}% (out of ${subject.ca_max || 100})`}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(subject.ca_score || 0, 100)}
                                sx={{
                                  width: 60,
                                  height: 8,
                                  borderRadius: 1,
                                  bgcolor: 'grey.200',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: getComponentBarColor(subject.ca_score || 0),
                                    borderRadius: 1,
                                  }
                                }}
                              />
                              <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 45, color: subject.ca_score ? 'info.main' : 'text.disabled' }}>
                                {subject.ca_score?.toFixed(1) || '-'}%
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        {/* Assignment */}
                        <TableCell align="center">
                          <Tooltip title={`Assignment Average: ${subject.assignment_avg?.toFixed(1) || 0}% (out of ${subject.assignment_max || 100})`}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(subject.assignment_avg || 0, 100)}
                                sx={{
                                  width: 60,
                                  height: 8,
                                  borderRadius: 1,
                                  bgcolor: 'grey.200',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: getComponentBarColor(subject.assignment_avg || 0),
                                    borderRadius: 1,
                                  }
                                }}
                              />
                              <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 45 }}>
                                {subject.assignment_avg?.toFixed(1) || 0}%
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={`Attendance: ${subject.attendance_score?.toFixed(1) || 0}% (out of ${subject.attendance_max || 100})`}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              <AccessTimeIcon fontSize="small" sx={{ color: getComponentBarColor(subject.attendance_score || 0) }} />
                              <Typography variant="body2" fontWeight="medium">
                                {subject.attendance_score?.toFixed(1) || 0}%
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(subject.total_score || 0, 100)}
                              sx={{
                                width: 80,
                                height: 10,
                                borderRadius: 1,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: getComponentBarColor(subject.total_score || 0),
                                  borderRadius: 1,
                                }
                              }}
                            />
                            <Typography variant="body1" fontWeight="bold" color="primary" sx={{ minWidth: 55 }}>
                              {subject.total_score?.toFixed(1) || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={getGradeLabel(subject.descriptive_grade || subject.letter_grade)}>
                            <Chip
                              icon={getPerformanceIcon(subject.total_score || 0)}
                              label={subject.descriptive_grade || subject.letter_grade || '-'}
                              size="small"
                              sx={{
                                backgroundColor: getGradeColor(subject.descriptive_grade || subject.letter_grade),
                                color: 'white',
                                fontWeight: 'bold',
                                minWidth: 60,
                                '& .MuiChip-icon': {
                                  color: 'white',
                                }
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Performance Summary */}
              <Box sx={{ mt: 3, p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  How Your Grade is Calculated
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ bgcolor: '#e3f2fd' }}>
                      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon color="primary" />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">Exams (70%)</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Mid-term, Final, Quizzes
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ bgcolor: '#e8f5e9' }}>
                      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssignmentIcon color="success" />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">Assignments (20%)</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Homework, Projects
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ bgcolor: '#fff3e0' }}>
                      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTimeIcon sx={{ color: '#ff9800' }} />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">Attendance (10%)</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Class Participation
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  <strong>Note:</strong> Your final grade is automatically calculated by the system based on these components.
                  Teachers enter individual scores, and the system applies the weighting to determine your final result.
                </Typography>
              </Box>

              {/* Teacher Remarks */}
              {(reportCard.teacher_remarks || reportCard.principal_remarks) && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrophyIcon /> Remarks
                  </Typography>
                  {reportCard.teacher_remarks && (
                    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Class Teacher's Remarks
                        </Typography>
                        <Typography variant="body2">
                          {reportCard.teacher_remarks}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                  {reportCard.principal_remarks && (
                    <Card variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Principal's Remarks
                        </Typography>
                        <Typography variant="body2">
                          {reportCard.principal_remarks}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          No report card available for the selected term. Report cards are generated after teachers enter exam, assignment, and attendance grades. The system automatically calculates your total score.
        </Alert>
      )}
    </Container>
  );
};

export default StudentAcademicReport;
