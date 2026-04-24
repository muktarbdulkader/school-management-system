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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import {
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';

const ParentAcademicOverview = () => {
  const user = useSelector((state) => state?.user?.user);
  const [loading, setLoading] = useState(false);
  const [termsLoading, setTermsLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [reportCards, setReportCards] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  // Fetch parent's children
  useEffect(() => {
    fetchChildren();
    fetchTerms();
  }, []);

  const fetchChildren = async () => {
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}parent_students/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setChildren(data.data);
        if (data.data.length > 0) {
          setSelectedChild(data.data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch children:', e);
      toast.error('Failed to load children data');
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

  // Fetch report cards when child or term changes
  useEffect(() => {
    if (selectedChild && selectedTerm) {
      fetchReportCardsForChild(selectedChild.student_id || selectedChild.id);
    }
  }, [selectedChild, selectedTerm]);

  const fetchReportCardsForChild = async (studentId) => {
    setLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(
        `${Backend.api}report_cards/?term_id=${selectedTerm}&student_id=${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        setReportCards(prev => ({
          ...prev,
          [studentId]: data.data?.[0] || null
        }));
      }
    } catch (e) {
      console.error('Failed to fetch report card:', e);
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

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return 'Outstanding performance! Keep up the excellent work!';
    if (percentage >= 80) return 'Very good performance. Keep striving for excellence!';
    if (percentage >= 70) return 'Good performance. Room for improvement in some areas.';
    if (percentage >= 60) return 'Satisfactory performance. Needs more effort and focus.';
    return 'Needs significant improvement. Please discuss with teachers.';
  };

  const currentReport = selectedChild ? reportCards[selectedChild.student_id || selectedChild.id] : null;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Children's Academic Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View report cards and academic performance of your children
          </Typography>
        </Box>
      </Box>

      {/* Child Selector (if multiple children) */}
      {children.length > 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => {
                setActiveTab(newValue);
                setSelectedChild(children[newValue]);
              }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {children.map((child, index) => (
                <Tab
                  key={child.id}
                  label={child.student_name || `Child ${index + 1}`}
                  icon={<PersonIcon />}
                />
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Term Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={termsLoading}>
                <InputLabel>{termsLoading ? 'Loading terms...' : 'Select Academic Term'}</InputLabel>
                <Select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  label={termsLoading ? 'Loading terms...' : 'Select Academic Term'}
                >
                  {terms.map((term) => (
                    <MenuItem key={term.id} value={term.id}>
                      {term.name} {term.is_current && <Chip size="small" label="Current" color="primary" sx={{ ml: 1 }} />}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              {selectedChild && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {(selectedChild.student_name || 'S').charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedChild.student_name || 'Student'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedChild.grade || 'Grade'} {selectedChild.section || ''}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : currentReport ? (
        <>
          {/* Overall Performance Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Performance Summary
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h3" fontWeight="bold" color="primary">
                      {currentReport.overall_percentage?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall Score
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Chip
                      label={`${currentReport.overall_grade}`}
                      sx={{
                        backgroundColor: getGradeColor(currentReport.overall_grade),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.5rem',
                        py: 1,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {getGradeLabel(currentReport.overall_grade)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h3" fontWeight="bold" color="secondary.main">
                      #{currentReport.rank}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Class Rank
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h3" fontWeight="bold">
                      {currentReport.subjects?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Subjects
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Performance Message */}
              <Alert
                severity={currentReport.overall_percentage >= 70 ? 'success' : currentReport.overall_percentage >= 60 ? 'warning' : 'error'}
                sx={{ mt: 3 }}
              >
                {getPerformanceMessage(currentReport.overall_percentage)}
              </Alert>
            </CardContent>
          </Card>

          {/* Subject-wise Breakdown */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subject-wise Performance
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Subject</strong></TableCell>
                      <TableCell align="center"><strong>Exam Score</strong></TableCell>
                      <TableCell align="center"><strong>Assignments</strong></TableCell>
                      <TableCell align="center"><strong>Attendance</strong></TableCell>
                      <TableCell align="center"><strong>Total Score</strong></TableCell>
                      <TableCell align="center"><strong>Grade</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentReport.subjects?.map((subject, index) => (
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
                          <Typography variant="body2">{subject.assignment_score?.toFixed(1)}%</Typography>
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
                            label={`${subject.grade} - ${getGradeLabel(subject.grade)}`}
                            size="small"
                            sx={{
                              backgroundColor: getGradeColor(subject.grade),
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* How Grades Are Calculated */}
              <Accordion sx={{ mt: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight="medium">
                    How are grades calculated?
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Examination Scores (60%):</strong> Average of all exams, quizzes, and tests in the subject.<br /><br />
                    <strong>Assignment Scores (30%):</strong> Average of all homework, projects, and assignments.<br /><br />
                    <strong>Attendance (10%):</strong> Based on class attendance percentage.<br /><br />
                    <strong>Grading Scale:</strong><br />
                    • EX/A: 90-100% (Excellent)<br />
                    • VG/B: 80-89% (Very Good)<br />
                    • G/C: 70-79% (Good)<br />
                    • S/D: 60-69% (Satisfactory)<br />
                    • NI/E: 50-59% (Needs Improvement)<br />
                    • U/F: Below 50% (Unsatisfactory)
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* Contact Teachers */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<EmailIcon />}>
                  Contact Class Teacher
                </Button>
                <Button variant="outlined" startIcon={<SchoolIcon />}>
                  Schedule Parent Meeting
                </Button>
              </Box>
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert severity="info">
          No report card available for the selected term. Report cards are generated after all assessments are completed and graded by teachers.
        </Alert>
      )}
    </Container>
  );
};

export default ParentAcademicOverview;
