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
} from '@mui/material';
import {
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
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
      const res = await fetch(`${Backend.api}/students/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStudentInfo(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch student info:', e);
    }
  };

  const fetchTerms = async () => {
    setTermsLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.terms}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTerms(data.data || []);
        const currentTerm = data.data?.find(t => t.is_current);
        if (currentTerm) {
          setSelectedTerm(currentTerm.id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch terms:', e);
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
        `${Backend.api}/report_cards/?term_id=${selectedTerm}&student_me=true`,
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
            {studentInfo ? `${studentInfo.name} | Grade ${studentInfo.grade_details?.grade} ${studentInfo.section_details?.name}` : 'Loading...'}
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
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" fontWeight="bold">
                      {reportCard.overall_percentage?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body1">Overall Score</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      label={`${reportCard.overall_grade} - ${getGradeLabel(reportCard.overall_grade)}`}
                      sx={{
                        backgroundColor: 'white',
                        color: getGradeColor(reportCard.overall_grade),
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        py: 1,
                        px: 2,
                      }}
                    />
                    <Typography variant="body1" sx={{ mt: 1 }}>Final Grade</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" fontWeight="bold">
                      #{reportCard.rank}
                    </Typography>
                    <Typography variant="body1">Class Rank</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Subject Details */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon /> Subject Performance
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Subject</strong></TableCell>
                      <TableCell align="center"><strong>Exams (60%)</strong></TableCell>
                      <TableCell align="center"><strong>Assignments (30%)</strong></TableCell>
                      <TableCell align="center"><strong>Attendance (10%)</strong></TableCell>
                      <TableCell align="center"><strong>Total</strong></TableCell>
                      <TableCell align="center"><strong>Grade</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportCard.subjects?.map((subject, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {subject.subject_name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={subject.exam_score || 0}
                              sx={{ width: 60, height: 6, borderRadius: 1 }}
                            />
                            <Typography variant="body2">{subject.exam_score?.toFixed(1)}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={subject.assignment_score || 0}
                              sx={{ width: 60, height: 6, borderRadius: 1 }}
                            />
                            <Typography variant="body2">{subject.assignment_score?.toFixed(1)}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{subject.attendance_score?.toFixed(1)}%</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body1" fontWeight="bold" color="primary">
                            {subject.total?.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={subject.grade}
                            size="small"
                            sx={{
                              backgroundColor: getGradeColor(subject.grade),
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

              {/* Performance Summary */}
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>How your grade is calculated:</strong>
                  <br />
                  • Exam scores account for 60% of your final grade
                  <br />
                  • Assignment scores account for 30% of your final grade
                  <br />
                  • Attendance accounts for 10% of your final grade
                  <br />
                  • Your rank is calculated by comparing your overall percentage with classmates
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          No report card available for the selected term. Report cards are generated after all exams and assignments are graded.
        </Alert>
      )}
    </Container>
  );
};

export default StudentAcademicReport;
