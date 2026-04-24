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
  Print as PrintIcon,
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
      const res = await fetch(`${Backend.api}students/me/`, {
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
    <>
      {/* Print Styles - Hide sidebar and navigation when printing */}
      <style>{`
        @media print {
          /* Hide sidebar, header, and navigation */
          .MuiDrawer-root,
          .MuiAppBar-root,
          [class*="sidebar"],
          [class*="navigation"],
          nav,
          aside,
          header:not(.print-header) {
            display: none !important;
          }
          
          /* Show only the main content */
          main, 
          .MuiContainer-root,
          [class*="main-content"] {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          /* Ensure report card prints nicely */
          .MuiCard-root {
            break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
          
          /* Hide print button when printing */
          .MuiChip-root[icon] {
            display: none !important;
          }
          
          /* Hide term selector when printing */
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      <Container maxWidth="lg" sx={{ py: 3, '@media print': { py: 0 } }} className="print-content">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, '@media print': { mb: 1 } }} className="print-header">
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
          {reportCard && (
            <Box sx={{ ml: 'auto' }}>
              <Chip
                icon={<PrintIcon />}
                label="Print Report"
                onClick={() => window.print()}
                color="primary"
                variant="outlined"
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          )}
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
                        {reportCard.overall_percentage !== null && reportCard.overall_percentage !== undefined
                          ? `${reportCard.overall_percentage.toFixed(1)}%`
                          : '...'}
                      </Typography>
                      <Typography variant="body1">Overall Score</Typography>
                      {reportCard.overall_percentage === null && (
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                          (Complete all subjects)
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip
                        label={reportCard.overall_grade || '...'}
                        sx={{
                          backgroundColor: 'white',
                          color: reportCard.overall_grade ? getGradeColor(reportCard.overall_grade) : '#666',
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                          py: 1,
                          px: 2,
                        }}
                      />
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {reportCard.overall_grade ? getGradeLabel(reportCard.overall_grade) : 'Grade'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h2" fontWeight="bold">
                        {reportCard.rank_in_class !== null && reportCard.rank_in_class !== undefined
                          && reportCard.total_students !== null && reportCard.total_students !== undefined
                          ? `${reportCard.rank_in_class}/${reportCard.total_students}`
                          : '...'}
                      </Typography>
                      <Typography variant="body1">Your Rank</Typography>
                      {reportCard.rank_in_class !== null && reportCard.total_students !== null ? (
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                          in class of {reportCard.total_students} students
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                          (Rank under process)
                        </Typography>
                      )}
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

                {/* Determine which columns have data */}
                {(() => {
                  const subjects = reportCard.subjects || [];
                  const hasAnyCA = subjects.some(s => s.ca_score !== null && s.ca_score !== undefined);
                  const hasAnyAssignment = subjects.some(s => s.assignment_avg !== null && s.assignment_avg !== undefined);
                  const hasAnyAttendance = subjects.some(s => s.attendance_score !== null && s.attendance_score !== undefined);
                  return (
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#1976d2' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Subject</TableCell>
                            <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Exams</TableCell>
                            {hasAnyCA && <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>C.A.</TableCell>}
                            {hasAnyAssignment && <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Assignment</TableCell>}
                            {hasAnyAttendance && <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Attendance</TableCell>}
                            <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
                            <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Grade</TableCell>
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
                              {/* Exams - Horizontal layout with type on top, score below */}
                              <TableCell align="center">
                                {subject.exam_types?.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {subject.exam_types.map((e, idx) => (
                                      <Box key={idx} sx={{ textAlign: 'center', minWidth: 60 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                          {e.type}
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                          {e.raw_score?.toFixed(0) || e.score?.toFixed(0)}/{e.max_score?.toFixed(0) || 100}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                ) : subject.exam_score !== null && subject.exam_score !== undefined ? (
                                  <Typography variant="body2" fontWeight="medium">
                                    {subject.exam_score.toFixed(1)}%
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.disabled">-</Typography>
                                )}
                              </TableCell>
                              {/* CA Score - Only if any subject has CA */}
                              {hasAnyCA && (
                                <TableCell align="center">
                                  {subject.ca_score !== null && subject.ca_score !== undefined ? (
                                    <Typography variant="body2" fontWeight="medium" color="info.main">
                                      {subject.ca_score.toFixed(1)}%
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" color="text.disabled">-</Typography>
                                  )}
                                </TableCell>
                              )}
                              {/* Assignment - Only if any subject has Assignment */}
                              {hasAnyAssignment && (
                                <TableCell align="center">
                                  {subject.assignment_avg !== null && subject.assignment_avg !== undefined ? (
                                    <Typography variant="body2" fontWeight="medium">
                                      {subject.assignment_avg.toFixed(1)}%
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" color="text.disabled">-</Typography>
                                  )}
                                </TableCell>
                              )}
                              {/* Attendance - Only if any subject has Attendance */}
                              {hasAnyAttendance && (
                                <TableCell align="center">
                                  {subject.attendance_score !== null && subject.attendance_score !== undefined ? (
                                    <Typography variant="body2" fontWeight="medium">
                                      {subject.attendance_score.toFixed(1)}%
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" color="text.disabled">-</Typography>
                                  )}
                                </TableCell>
                              )}
                              {/* Total */}
                              <TableCell align="center">
                                <Typography variant="body1" fontWeight="bold" color={subject.total_score >= 80 ? 'success.main' : subject.total_score >= 60 ? 'warning.main' : 'error.main'}>
                                  {subject.total_score?.toFixed(1) || 0}%
                                </Typography>
                              </TableCell>
                              {/* Grade */}
                              <TableCell align="center">
                                <Chip
                                  label={subject.descriptive_grade || subject.letter_grade || '-'}
                                  size="small"
                                  sx={{
                                    backgroundColor: getGradeColor(subject.descriptive_grade || subject.letter_grade),
                                    color: 'white',
                                    fontWeight: 'bold',
                                    minWidth: 50,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  );
                })()}

                {/* Teacher Remarks */}
                {
                  (reportCard.teacher_remarks || reportCard.principal_remarks) && (
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
                  )
                }
              </CardContent>
            </Card>
          </>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No report card available for the selected term. Report cards are generated after teachers enter exam, assignment, and attendance grades. The system automatically calculates your total score.
          </Alert>
        )}
      </Container>
    </>
  );
};

export default StudentAcademicReport;
