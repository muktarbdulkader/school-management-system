import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Print as PrintIcon,
  PlayArrow as GenerateIcon,
} from '@mui/icons-material';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';

const TeacherReportCards = () => {
  const user = useSelector((state) => state?.user?.user);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [termsLoading, setTermsLoading] = useState(true);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [viewReportDialogOpen, setViewReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchTerms();
    fetchClasses();
  }, []);

  const fetchTerms = async () => {
    setTermsLoading(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.terms}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTerms(data.data || []);
    } catch (e) {
      console.error('Failed to fetch terms:', e);
    } finally {
      setTermsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}${Backend.classes}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setClasses(data.data || []);
    } catch (e) {
      console.error('Failed to fetch classes:', e);
    }
  };

  // Fetch report cards when filters change
  useEffect(() => {
    if (selectedTerm && selectedClass) {
      fetchReportCards();
    }
  }, [selectedTerm, selectedClass, selectedSection]);

  const fetchReportCards = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      const queryParams = new URLSearchParams();
      queryParams.append('term_id', selectedTerm);
      queryParams.append('class_id', selectedClass);
      if (selectedSection) queryParams.append('section_id', selectedSection);

      const res = await fetch(`${Backend.api}report_cards/?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setReportCards(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch report cards:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReportCards = async () => {
    setGenerating(true);
    try {
      const token = await GetToken();
      const res = await fetch(`${Backend.api}report_cards/generate/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term_id: selectedTerm,
          class_id: selectedClass,
          section_id: selectedSection || null,
          publish: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Report cards generated successfully!');
        fetchReportCards();
      } else {
        toast.error(data.message || 'Failed to generate report cards');
      }
    } catch (e) {
      console.error('Failed to generate report cards:', e);
      toast.error('Failed to generate report cards');
    } finally {
      setGenerating(false);
      setGenerateDialogOpen(false);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'EX': '#4caf50',
      'VG': '#8bc34a',
      'G': '#ffc107',
      'S': '#ff9800',
      'NI': '#f44336',
      'U': '#d32f2f',
      'A': '#4caf50',
      'B': '#8bc34a',
      'C': '#ffc107',
      'D': '#ff9800',
      'E': '#f44336',
      'F': '#d32f2f',
    };
    return colors[grade] || '#757575';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold">
          Report Card Management
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        As a teacher, you can generate and view report cards for your assigned classes.
        Report cards are calculated automatically from exam results, assignments, and attendance.
      </Alert>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Filters
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={termsLoading}>
                <InputLabel>{termsLoading ? 'Loading terms...' : 'Term'}</InputLabel>
                <Select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  label={termsLoading ? 'Loading terms...' : 'Term'}
                >
                  {terms.map((term) => (
                    <MenuItem key={term.id} value={term.id}>
                      {term.name} ({term.academic_year})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  label="Class"
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      Grade {cls.grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Section (Optional)</InputLabel>
                <Select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  label="Section"
                >
                  <MenuItem value="">All Sections</MenuItem>
                  {/* Sections would be loaded based on class */}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<GenerateIcon />}
              onClick={() => setGenerateDialogOpen(true)}
              disabled={!selectedTerm || !selectedClass || generating}
            >
              {generating ? 'Generating...' : 'Generate Report Cards'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              disabled={reportCards.length === 0}
            >
              Print All
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Report Cards Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : reportCards.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Overall %</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Subjects</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportCards.map((report, index) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Chip
                      label={report.rank || index + 1}
                      size="small"
                      color={report.rank <= 3 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {report.student_details?.user?.full_name || report.student_details?.user?.username || report.student_name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {report.student_details?.student_id || report.student_id || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={report.overall_percentage || 0}
                        sx={{ width: 100, height: 8, borderRadius: 1 }}
                      />
                      <Typography variant="body2">
                        {report.overall_percentage?.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.overall_grade}
                      sx={{
                        backgroundColor: getGradeColor(report.overall_grade),
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{report.subject_count || 0} subjects</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedReport(report);
                        setViewReportDialogOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : selectedTerm && selectedClass ? (
        <Alert severity="warning">
          No report cards found. Click "Generate Report Cards" to create them.
        </Alert>
      ) : (
        <Alert severity="info">
          Please select a Term and Class to view report cards.
        </Alert>
      )}

      {/* Generate Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📝 Generate Report Cards</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will generate report cards for all students in the selected class and term.
            The K-12 grade calculation includes:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <li><strong>Exam Scores (60%)</strong> - Midterm & Final exams</li>
            <li><strong>Continuous Assessment (20%)</strong> - Daily quizzes, homework, participation</li>
            <li><strong>Assignments (10%)</strong> - Major projects & assignments</li>
            <li><strong>Attendance (10%)</strong> - Class attendance record</li>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Note: If any component is missing, weights are redistributed proportionally.
            Example: If only exams are entered, they count for 100% of the grade.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            This process may take a few minutes for large classes.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerateReportCards}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={20} /> : <GenerateIcon />}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={viewReportDialogOpen} onClose={() => setViewReportDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">📋 Student Report Card</Typography>
            <Chip
              label={`Rank: ${selectedReport?.rank_in_class || selectedReport?.rank || 'N/A'} of ${selectedReport?.total_students || 'N/A'}`}
              color="primary"
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              {/* Student Info Header */}
              <Card variant="outlined" sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Student Name</Typography>
                    <Typography variant="h6">{selectedReport.student_details?.user?.full_name || selectedReport.student_name}</Typography>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">Class</Typography>
                    <Typography variant="body1">{selectedReport.class_details?.grade || selectedReport.class_name}</Typography>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">Term</Typography>
                    <Typography variant="body1">{selectedReport.term_details?.name || selectedReport.term_name}</Typography>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">Overall %</Typography>
                    <Typography variant="h6" color={selectedReport.overall_percentage >= 80 ? 'success.main' : selectedReport.overall_percentage >= 60 ? 'warning.main' : 'error.main'}>
                      {selectedReport.overall_percentage?.toFixed(1) || '0.0'}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Typography variant="subtitle2" color="text.secondary">Grade</Typography>
                    <Chip
                      label={selectedReport.overall_grade || 'N/A'}
                      size="small"
                      sx={{
                        backgroundColor: getGradeColor(selectedReport.overall_grade),
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </Grid>
                </Grid>
              </Card>

              {/* Subjects Table - Only shows columns with entered data */}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#1976d2' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Subject</TableCell>
                      {/* Only show Exam column if any subject has exam data */}
                      {selectedReport.subjects?.some(s => s.exam_score !== null && s.exam_score !== undefined) && (
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Exam<br /><Typography variant="caption" sx={{ color: 'white' }}>(60%)</Typography></TableCell>
                      )}
                      {/* Only show CA column if any subject has CA data */}
                      {selectedReport.subjects?.some(s => s.ca_score !== null && s.ca_score !== undefined) && (
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>C.A.<br /><Typography variant="caption" sx={{ color: 'white' }}>(20%)</Typography></TableCell>
                      )}
                      {/* Only show Assignment column if any subject has assignment data */}
                      {selectedReport.subjects?.some(s => s.assignment_avg !== null && s.assignment_avg !== undefined) && (
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Assignment<br /><Typography variant="caption" sx={{ color: 'white' }}>(10%)</Typography></TableCell>
                      )}
                      {/* Only show Attendance column if any subject has attendance data */}
                      {selectedReport.subjects?.some(s => s.attendance_score !== null && s.attendance_score !== undefined) && (
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Attendance<br /><Typography variant="caption" sx={{ color: 'white' }}>(10%)</Typography></TableCell>
                      )}
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Total Score</TableCell>
                      <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Grade</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedReport.subjects?.map((subject, index) => (
                      <TableRow key={index} sx={{ '&:nth-of-type(even)': { backgroundColor: '#f8f9fa' } }}>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {subject.subject_details?.name || subject.subject?.name || 'Unknown Subject'}
                        </TableCell>
                        {/* Exam - Only shows if teacher entered any exam */}
                        {selectedReport.subjects?.some(s => s.exam_score !== null && s.exam_score !== undefined) && (
                          <TableCell align="center">
                            {subject.exam_score !== null && subject.exam_score !== undefined ? (
                              <Tooltip title={subject.exam_types?.length > 0
                                ? `Exams entered: ${subject.exam_types.map(e => `${e.type}: ${e.score.toFixed(1)}%`).join(', ')}`
                                : 'Teacher entered exam score'}>
                                <Box>
                                  <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                                    {subject.exam_score.toFixed(1)}%
                                  </Typography>
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
                            ) : (
                              <Typography variant="caption" color="text.disabled">-</Typography>
                            )}
                          </TableCell>
                        )}
                        {/* CA - Only shows if teacher entered continuous assessment */}
                        {selectedReport.subjects?.some(s => s.ca_score !== null && s.ca_score !== undefined) && (
                          <TableCell align="center">
                            {subject.ca_score !== null && subject.ca_score !== undefined ? (
                              <Tooltip title="Teacher entered CA (quizzes, homework)">
                                <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 500 }}>
                                  {subject.ca_score.toFixed(1)}%
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.disabled">-</Typography>
                            )}
                          </TableCell>
                        )}
                        {/* Assignment - Only shows if teacher entered */}
                        {selectedReport.subjects?.some(s => s.assignment_avg !== null && s.assignment_avg !== undefined) && (
                          <TableCell align="center">
                            {subject.assignment_avg !== null && subject.assignment_avg !== undefined ? (
                              <Tooltip title="Teacher entered assignment score">
                                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                                  {subject.assignment_avg.toFixed(1)}%
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.disabled">-</Typography>
                            )}
                          </TableCell>
                        )}
                        {/* Attendance - Only shows if teacher entered */}
                        {selectedReport.subjects?.some(s => s.attendance_score !== null && s.attendance_score !== undefined) && (
                          <TableCell align="center">
                            {subject.attendance_score !== null && subject.attendance_score !== undefined ? (
                              <Tooltip title="Teacher marked attendance">
                                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                                  {subject.attendance_score.toFixed(1)}%
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.disabled">-</Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell align="center">
                          {subject.total_score !== null && subject.total_score !== undefined ? (
                            <Typography variant="body1" fontWeight="bold" sx={{ color: subject.total_score >= 80 ? 'success.main' : subject.total_score >= 60 ? 'warning.main' : 'error.main' }}>
                              {subject.total_score.toFixed(1)}%
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.disabled">N/A</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {subject.letter_grade ? (
                            <Chip
                              label={subject.letter_grade}
                              size="small"
                              sx={{
                                backgroundColor: getGradeColor(subject.letter_grade),
                                color: 'white',
                                fontWeight: 'bold',
                                minWidth: 40,
                              }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.disabled">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {subject.teacher_comment || subject.descriptive_grade_display || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!selectedReport.subjects?.length && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No subjects found. Please generate report cards first.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Per-Subject Calculation Summary */}
              {selectedReport.subjects?.length > 0 && (
                <Card variant="outlined" sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📋 Subject Calculation Details (Actual Weights Used)
                  </Typography>
                  {selectedReport.subjects.map((subject, idx) => {
                    const hasExam = subject.exam_score !== null && subject.exam_score !== undefined;
                    const hasCA = subject.ca_score !== null && subject.ca_score !== undefined;
                    const hasAssign = subject.assignment_avg !== null && subject.assignment_avg !== undefined;
                    const hasAttend = subject.attendance_score !== null && subject.attendance_score !== undefined;

                    // Calculate actual weights
                    let totalWeight = 0;
                    if (hasExam) totalWeight += 60;
                    if (hasCA) totalWeight += 20;
                    if (hasAssign) totalWeight += 10;
                    if (hasAttend) totalWeight += 10;

                    const examWeight = hasExam ? Math.round((60 / totalWeight) * 100) : 0;
                    const caWeight = hasCA ? Math.round((20 / totalWeight) * 100) : 0;
                    const assignWeight = hasAssign ? Math.round((10 / totalWeight) * 100) : 0;
                    const attendWeight = hasAttend ? Math.round((10 / totalWeight) * 100) : 0;

                    return (
                      <Box key={idx} sx={{ mb: 1, p: 1, backgroundColor: 'white', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {subject.subject_details?.name || subject.subject?.name}:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {hasExam && <Chip size="small" variant="outlined" label={`Exam: ${examWeight}%`} sx={{ height: 20, fontSize: '0.7rem' }} />}
                          {hasCA && <Chip size="small" variant="outlined" label={`CA: ${caWeight}%`} sx={{ height: 20, fontSize: '0.7rem', color: 'info.main' }} />}
                          {hasAssign && <Chip size="small" variant="outlined" label={`Assign: ${assignWeight}%`} sx={{ height: 20, fontSize: '0.7rem' }} />}
                          {hasAttend && <Chip size="small" variant="outlined" label={`Attend: ${attendWeight}%`} sx={{ height: 20, fontSize: '0.7rem' }} />}
                          <Chip size="small" color="primary" label={`Total: ${subject.total_score?.toFixed(1) || 0}%`} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Card>
              )}

            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewReportDialogOpen(false)} variant="outlined">Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />} color="primary">
            Print Report
          </Button>
        </DialogActions>
      </Dialog>
    </Container >
  );
};

export default TeacherReportCards;
