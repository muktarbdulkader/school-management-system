import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as AssessmentIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import Backend from 'services/backend';
import { Storage } from 'configration/storage';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [adminEvaluation, setAdminEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    report_period: 'monthly',
    start_date: '',
    end_date: '',
    overall_score: '',
    attendance_score: '',
    task_completion_score: '',
    lesson_coverage_score: '',
    rating_score: '',
    student_performance_score: '',
    strengths: '',
    areas_for_improvement: '',
    recommendations: ''
  });

  const periodOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'semester', label: 'Semester' },
    { value: 'annual', label: 'Annual' }
  ];

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const token = Storage.getItem('token');
      const response = await fetch(`${Backend.api}${Backend.teacherReports}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      const token = Storage.getItem('token');
      const response = await fetch(`${Backend.api}${Backend.teacherReports}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setOpenDialog(false);
        setFormData({
          report_period: 'monthly',
          start_date: '',
          end_date: '',
          overall_score: '',
          attendance_score: '',
          task_completion_score: '',
          lesson_coverage_score: '',
          rating_score: '',
          student_performance_score: '',
          strengths: '',
          areas_for_improvement: '',
          recommendations: ''
        });
        fetchMyReports();
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to create report');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getScoreColor = (score) => {
    const num = parseFloat(score) || 0;
    if (num >= 80) return 'success';
    if (num >= 60) return 'warning';
    return 'error';
  };

  const getScoreGradient = (score) => {
    const num = parseFloat(score) || 0;
    if (num >= 80) return 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';
    if (num >= 60) return 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)';
    return 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
  };

  const getLatestReport = () => {
    return reports.length > 0 ? reports[0] : null;
  };

  const latestReport = getLatestReport();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 56,
          height: 56,
          borderRadius: '16px',
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)'
        }}>
          <SchoolIcon sx={{ color: 'white', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1a237e">
            My Performance Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your teaching performance and growth
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Latest Report - Hero Card */}
      {latestReport && (
        <Card sx={{
          mb: 4,
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          {/* Header Banner */}
          <Box sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box display="flex" alignItems="center" gap={1}>
              <EmojiEventsIcon />
              <Typography variant="h6" fontWeight={600}>Latest Performance Report</Typography>
            </Box>
            <Chip
              label={latestReport.report_period?.toUpperCase()}
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                color: 'primary.main',
                fontWeight: 700,
                borderRadius: 2
              }}
              size="small"
            />
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="center">
              {/* Score Circle */}
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: getScoreGradient(latestReport.overall_score),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    color: 'white'
                  }}>
                    <Typography variant="h2" fontWeight={800} lineHeight={1}>
                      {latestReport.overall_score}
                    </Typography>
                    <Typography variant="caption" fontWeight={500}>
                      SCORE
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={parseFloat(latestReport.overall_score) >= 80 ? 'Excellent' : parseFloat(latestReport.overall_score) >= 60 ? 'Good' : 'Needs Improvement'}
                      color={getScoreColor(latestReport.overall_score)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </Grid>

              {/* Details */}
              <Grid item xs={12} md={9}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalendarIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                          REPORT PERIOD
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={500}>
                        {latestReport.start_date} to {latestReport.end_date}
                      </Typography>
                    </Paper>
                  </Grid>

                  {latestReport.recommendations && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.light' }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <LightbulbIcon color="info" fontSize="small" />
                          <Typography variant="subtitle2" fontWeight={600} color="info.dark">
                            RECOMMENDATIONS
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {latestReport.recommendations}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Reports List Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <TrendingUpIcon color="primary" />
        <Typography variant="h5" fontWeight={700} color="#1a237e">
          Report History
        </Typography>
        <Chip label={reports.length} size="small" sx={{ fontWeight: 600 }} />
      </Box>

      {reports.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
          <AssessmentIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
          <Typography color="textSecondary" variant="h6" gutterBottom>
            No performance reports yet
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Your reports will appear here once generated by admin
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {reports.map((report, index) => (
            <Grid item xs={12} key={report.id}>
              <Paper sx={{
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  transform: 'translateY(-2px)'
                }
              }}>
                {/* Accordion Header */}
                <Accordion
                  defaultExpanded={index === 0}
                  sx={{
                    boxShadow: 'none',
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      bgcolor: index === 0 ? 'primary.lighter' : 'background.paper',
                      borderRadius: 3,
                      '& .MuiAccordionSummary-content': { marginY: 1.5 }
                    }}
                  >
                    <Box display="flex" alignItems="center" width="100%" gap={2}>
                      <Chip
                        label={report.report_period}
                        color={index === 0 ? 'primary' : 'default'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          minWidth: 80
                        }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          {report.start_date} to {report.end_date}
                        </Typography>
                      </Box>
                      <Box sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        bgcolor: parseFloat(report.overall_score) >= 80 ? 'success.lighter' : parseFloat(report.overall_score) >= 60 ? 'warning.lighter' : 'error.lighter'
                      }}>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          sx={{
                            color: parseFloat(report.overall_score) >= 80 ? 'success.dark' : parseFloat(report.overall_score) >= 60 ? 'warning.dark' : 'error.dark'
                          }}
                        >
                          {report.overall_score}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 3, pt: 2 }}>
                    <Grid container spacing={3}>
                      {/* Strengths */}
                      {report.strengths && (
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: 'success.lighter', height: '100%' }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                              <CheckCircleIcon color="success" fontSize="small" />
                              <Typography variant="subtitle2" fontWeight={700} color="success.dark">
                                KEY STRENGTHS
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                              {report.strengths}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}

                      {/* Areas for Improvement */}
                      {report.areas_for_improvement && (
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: 'error.lighter', height: '100%' }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                              <WarningIcon color="error" fontSize="small" />
                              <Typography variant="subtitle2" fontWeight={700} color="error.dark">
                                AREAS FOR IMPROVEMENT
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                              {report.areas_for_improvement}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}

                      {/* Recommendations */}
                      {report.recommendations && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.light' }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                              <LightbulbIcon color="info" fontSize="small" />
                              <Typography variant="subtitle2" fontWeight={700} color="info.dark">
                                RECOMMENDATIONS
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                              {report.recommendations}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Report Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Performance Report</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Report Period</InputLabel>
                  <Select
                    value={formData.report_period}
                    label="Report Period"
                    onChange={(e) => setFormData({ ...formData, report_period: e.target.value })}
                  >
                    {periodOptions.map(period => (
                      <MenuItem key={period.value} value={period.value}>{period.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Overall Score (0-100)"
                  type="number"
                  value={formData.overall_score}
                  onChange={(e) => setFormData({ ...formData, overall_score: e.target.value })}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Attendance Score"
                  type="number"
                  value={formData.attendance_score}
                  onChange={(e) => setFormData({ ...formData, attendance_score: e.target.value })}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Task Completion Score"
                  type="number"
                  value={formData.task_completion_score}
                  onChange={(e) => setFormData({ ...formData, task_completion_score: e.target.value })}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Student Performance Score"
                  type="number"
                  value={formData.student_performance_score}
                  onChange={(e) => setFormData({ ...formData, student_performance_score: e.target.value })}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Key Strengths"
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Areas for Improvement"
                  value={formData.areas_for_improvement}
                  onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recommendations"
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateReport}
            variant="contained"
            disabled={!formData.overall_score || !formData.start_date || !formData.end_date}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyReports;
