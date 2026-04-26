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
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Grade as GradeIcon,
  MenuBook as MenuBookIcon,
  Print as PrintIcon,
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

  // Fetch parent's children and terms
  useEffect(() => {
    fetchChildren();
    fetchTerms();
  }, []);

  // Refetch report card when child or term changes
  useEffect(() => {
    console.log('[Parent] selectedChild changed:', selectedChild);
    console.log('[Parent] selectedTerm:', selectedTerm);
    // Use student_details.id (actual student ID) not ParentStudent relationship ID
    const studentId = selectedChild?.student_details?.id || selectedChild?.student_id;
    if (studentId && selectedTerm) {
      console.log('[Parent] Fetching for student id:', studentId);
      fetchReportCardsForChild(studentId);
    }
  }, [selectedChild, selectedTerm]);

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
      console.log('[Parent] Fetching terms from:', `${Backend.api}${Backend.terms}`);
      const res = await fetch(`${Backend.api}${Backend.terms}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('[Parent] Terms response:', data);
      if (data.success) {
        const termsData = data.data || [];
        console.log('[Parent] Terms loaded:', termsData.length, termsData);
        setTerms(termsData);
        const currentTerm = termsData.find(t => t.is_current);
        if (currentTerm) {
          console.log('[Parent] Setting current term:', currentTerm.id, currentTerm.name);
          setSelectedTerm(currentTerm.id);
        } else if (termsData.length > 0) {
          console.log('[Parent] No current term, selecting first:', termsData[0].id);
          setSelectedTerm(termsData[0].id);
        }
      } else {
        console.error('[Parent] Terms fetch failed:', data.message);
        toast.error(data.message || 'Failed to load terms');
      }
    } catch (e) {
      console.error('[Parent] Failed to fetch terms:', e);
      toast.error('Failed to load academic terms');
    } finally {
      setTermsLoading(false);
    }
  };

  const fetchReportCardsForChild = async (studentId) => {
    setLoading(true);
    try {
      const token = await GetToken();
      const url = `${Backend.api}report_cards/?term_id=${selectedTerm}&student_id=${studentId}`;
      console.log('[Parent] Fetching report card:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('[Parent] Report card response:', data);
      if (data.success) {
        console.log('[Parent] Report card data:', data.data?.[0]);
        setReportCards(prev => ({
          ...prev,
          [studentId]: data.data?.[0] || null
        }));
      } else {
        console.error('[Parent] Report card fetch failed:', data.message);
      }
    } catch (e) {
      console.error('[Parent] Failed to fetch report card:', e);
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

  // Use student_details.id for the reportCards key
  const studentId = selectedChild?.student_details?.id || selectedChild?.student_id;
  const currentReport = selectedChild ? reportCards[studentId] : null;
  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          .MuiDrawer-root, .MuiAppBar-root, nav, aside, header:not(.print-header) { display: none !important; }
          main, .MuiContainer-root { margin: 0 !important; padding: 0 !important; width: 100% !important; }
          .MuiCard-root { break-inside: avoid; box-shadow: none !important; border: 1px solid #ddd !important; }
          .print-hide { display: none !important; }
          .print-content { padding: 0 !important; }
        }
      `}</style>

      <Container maxWidth="lg" sx={{ py: 3 }} className="print-content">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }} className="print-header">
          <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Children's Academic Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View report cards and academic performance of your children
            </Typography>
          </Box>
          {currentReport && (
            <Box sx={{ ml: 'auto' }} className="print-hide">
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
                    label={child.student_details?.name || child.student_name || `Child ${index + 1}`}
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
                {termsLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography>Loading terms...</Typography>
                  </Box>
                ) : terms.length === 0 ? (
                  <Alert severity="warning">No academic terms available</Alert>
                ) : (
                  <FormControl fullWidth>
                    <InputLabel id="term-select-label">Select Academic Term</InputLabel>
                    <Select
                      labelId="term-select-label"
                      value={selectedTerm || ''}
                      onChange={(e) => {
                        console.log('[Parent] Term selected:', e.target.value);
                        setSelectedTerm(e.target.value);
                      }}
                      label="Select Academic Term"
                    >
                      {terms.map((term) => (
                        <MenuItem key={term.id} value={term.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {term.name}
                            {term.is_current && <Chip size="small" label="Current" color="primary" sx={{ ml: 1 }} />}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {selectedChild && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {(selectedChild.student_details?.name || selectedChild.student_name || 'S').charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedChild.student_details?.name || selectedChild.student_name || 'Student'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Grade {selectedChild.student_details?.grade_details?.grade || selectedChild.grade || ''} {selectedChild.student_details?.section_details?.name || selectedChild.section || ''}
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
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                  <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Overall Performance Summary
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
                      <TrendingUpIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
                      <Typography variant="h4" fontWeight="bold">
                        {currentReport.overall_percentage !== null && currentReport.overall_percentage !== undefined
                          ? `${currentReport.overall_percentage.toFixed(1)}%`
                          : '...'}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {currentReport.overall_percentage !== null ? 'Overall Score' : '(Complete all subjects)'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
                      <GradeIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
                      <Typography variant="h4" fontWeight="bold">
                        {currentReport.overall_grade || '...'}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {currentReport.overall_grade ? getGradeLabel(currentReport.overall_grade) : 'Grade'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
                      <TrophyIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
                      <Typography variant="h4" fontWeight="bold">
                        {currentReport.rank_in_class !== null && currentReport.total_students !== null
                          ? `${currentReport.rank_in_class}/${currentReport.total_students}`
                          : '...'}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {currentReport.rank_in_class !== null ? 'Class Rank' : '(Rank under process)'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
                      <MenuBookIcon sx={{ fontSize: 32, mb: 1, opacity: 0.9 }} />
                      <Typography variant="h4" fontWeight="bold">
                        {currentReport.subjects?.length || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Subjects
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Performance Message */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {getPerformanceMessage(currentReport.overall_percentage)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Subject-wise Breakdown */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Subject-wise Performance
                </Typography>

                {/* Determine which columns have data */}
                {(() => {
                  const subjects = currentReport.subjects || [];
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
                          {currentReport.subjects?.map((subject, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                    <SchoolIcon fontSize="small" />
                                  </Avatar>
                                  <Typography variant="body1" fontWeight="medium">
                                    {subject.subject_details?.name || subject.subject_name || subject.subject}
                                  </Typography>
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
                              <TableCell align="center">
                                <Typography variant="body1" fontWeight="bold" color={subject.total_score >= 80 ? 'success.main' : subject.total_score >= 60 ? 'warning.main' : 'error.main'}>
                                  {subject.total_score?.toFixed(1) || 0}%
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={subject.descriptive_grade || subject.letter_grade || subject.grade || '-'}
                                  size="small"
                                  sx={{
                                    backgroundColor: getGradeColor(subject.descriptive_grade || subject.letter_grade || subject.grade),
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
                  );
                })()}

              </CardContent>
            </Card>
          </>
        ) : (
          <Alert severity="info">
            No report card available for the selected term. Report cards are generated after all assessments are completed and graded by teachers.
          </Alert>
        )}
      </Container>
    </>
  );
};

export default ParentAcademicOverview;
