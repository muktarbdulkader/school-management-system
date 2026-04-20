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

      const res = await fetch(`${Backend.api}/report_cards/?${queryParams}`, {
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
      const res = await fetch(`${Backend.api}/report_cards/generate/`, {
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
                  <TableCell>{report.student_name}</TableCell>
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
        <DialogTitle>Generate Report Cards</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will generate report cards for all students in the selected class and term.
            The calculation includes:
          </Typography>
          <ul>
            <li>Exam scores (60% weight)</li>
            <li>Assignment scores (30% weight)</li>
            <li>Attendance (10% weight)</li>
          </ul>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This process may take a few minutes for large classes.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
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
      <Dialog open={viewReportDialogOpen} onClose={() => setViewReportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Student Report Card</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedReport.student_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall: {selectedReport.overall_percentage?.toFixed(1)}% | Grade: {selectedReport.overall_grade} | Rank: {selectedReport.rank}
              </Typography>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Exam Score</TableCell>
                      <TableCell>Assignment</TableCell>
                      <TableCell>Attendance</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Grade</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedReport.subjects?.map((subject) => (
                      <TableRow key={subject.subject_name}>
                        <TableCell>{subject.subject_name}</TableCell>
                        <TableCell>{subject.exam_score?.toFixed(1)}%</TableCell>
                        <TableCell>{subject.assignment_score?.toFixed(1)}%</TableCell>
                        <TableCell>{subject.attendance_score?.toFixed(1)}%</TableCell>
                        <TableCell>
                          <strong>{subject.total?.toFixed(1)}%</strong>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={subject.grade}
                            size="small"
                            sx={{
                              backgroundColor: getGradeColor(subject.grade),
                              color: 'white',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewReportDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />}>
            Print Report
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherReportCards;
