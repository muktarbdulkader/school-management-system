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
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import Backend from 'services/backend';
import { Storage } from 'configration/storage';

const MyReports = () => {
  const [reports, setReports] = useState([]);
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
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>My Performance Reports</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Latest Report Summary */}
      {latestReport && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <AssessmentIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Latest Performance Report</Typography>
              <Chip
                label={latestReport.report_period}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="h3" color="primary.main">
                  {latestReport.overall_score}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Overall Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(latestReport.overall_score)}
                  color={getScoreColor(parseFloat(latestReport.overall_score))}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="textSecondary">Attendance</Typography>
                    <Typography variant="h6">{latestReport.attendance_score}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="textSecondary">Task Completion</Typography>
                    <Typography variant="h6">{latestReport.task_completion_score}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="textSecondary">Student Performance</Typography>
                    <Typography variant="h6">{latestReport.student_performance_score}</Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Add Report Button */}
      <Box sx={{ mb: 2 }}>
        {/* <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Generate New Report
        </Button> */}
      </Box>

      {/* Reports List */}
      <Typography variant="h6" gutterBottom>Report History ({reports.length})</Typography>

      {reports.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No performance reports found. Generate your first report!
          </Typography>
        </Paper>
      ) : (
        reports.map((report) => (
          <Accordion key={report.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" width="100%">
                <Chip
                  label={report.report_period}
                  color="primary"
                  size="small"
                  sx={{ mr: 2 }}
                />
                <Typography sx={{ flexGrow: 1 }}>
                  {report.start_date} to {report.end_date}
                </Typography>
                <Typography variant="h6" color={getScoreColor(parseFloat(report.overall_score))}>
                  {report.overall_score}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Key Strengths</Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {report.strengths || 'Not provided'}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>Areas for Improvement</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {report.areas_for_improvement || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Score Breakdown</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">Attendance: {report.attendance_score}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(report.attendance_score)}
                      color={getScoreColor(parseFloat(report.attendance_score))}
                      sx={{ height: 6 }}
                    />
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">Task Completion: {report.task_completion_score}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(report.task_completion_score)}
                      color={getScoreColor(parseFloat(report.task_completion_score))}
                      sx={{ height: 6 }}
                    />
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">Student Performance: {report.student_performance_score}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(report.student_performance_score)}
                      color={getScoreColor(parseFloat(report.student_performance_score))}
                      sx={{ height: 6 }}
                    />
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">Rating: {report.rating_score}</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(report.rating_score)}
                      color={getScoreColor(parseFloat(report.rating_score))}
                      sx={{ height: 6 }}
                    />
                  </Box>
                </Grid>
              </Grid>
              {report.recommendations && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>Recommendations</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {report.recommendations}
                  </Typography>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))
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
