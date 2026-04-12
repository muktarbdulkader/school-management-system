import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Paper,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import Backend from 'services/backend';
import { Storage } from 'configration/storage';

const MyPerformance = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyPerformance();
  }, []);

  const fetchMyPerformance = async () => {
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
        throw new Error('Failed to fetch performance data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <Typography variant="h4" gutterBottom>My Performance</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!latestReport ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No performance data available. Generate your first report!
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Overall Score Card */}
          <Card sx={{ mb: 3, bgcolor: 'primary.light' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AssessmentIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Current Performance Summary</Typography>
                <Chip
                  label={latestReport.report_period}
                  color="primary"
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} textAlign="center">
                  <Typography variant="h2" color="primary.main" fontWeight="bold">
                    {latestReport.overall_score}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Overall Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(latestReport.overall_score)}
                    color={getScoreColor(parseFloat(latestReport.overall_score))}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>Performance Breakdown</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="h5" color={getScoreColor(parseFloat(latestReport.attendance_score))}>
                        {latestReport.attendance_score}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Attendance</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="h5" color={getScoreColor(parseFloat(latestReport.task_completion_score))}>
                        {latestReport.task_completion_score}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Task Completion</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="h5" color={getScoreColor(parseFloat(latestReport.student_performance_score))}>
                        {latestReport.student_performance_score}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Student Performance</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="h5" color={getScoreColor(parseFloat(latestReport.rating_score))}>
                        {latestReport.rating_score}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">Rating</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Performance Details */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="success.main">Key Strengths</Typography>
                  <Typography variant="body1">
                    {latestReport.strengths || 'No strengths recorded'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="warning.main">Areas for Improvement</Typography>
                  <Typography variant="body1">
                    {latestReport.areas_for_improvement || 'No areas for improvement recorded'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="info.main">Recommendations</Typography>
                  <Typography variant="body1">
                    {latestReport.recommendations || 'No recommendations recorded'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Report Period Info */}
          <Box mt={3}>
            <Typography variant="body2" color="textSecondary" align="center">
              Report Period: {latestReport.start_date} to {latestReport.end_date}
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              Total Reports Available: {reports.length}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default MyPerformance;
