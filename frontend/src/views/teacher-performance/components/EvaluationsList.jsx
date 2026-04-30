import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Rating,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Box
} from '@mui/material';
import {
  IconEye,
  IconCheck,
  IconChecks,
  IconSend,
  IconRefresh,
  IconTrash,
  IconEdit,
  IconFileDescription,
  IconPlus
} from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import dayjs from 'dayjs';

const STATUS_COLORS = {
  draft: 'default',
  submitted: 'warning',
  reviewed: 'info',
  approved: 'success'
};

const EvaluationsList = ({ teacherId = null, open, onClose, onEdit, onCreate, canCreate = false }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingEvaluation, setViewingEvaluation] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [terms, setTerms] = useState([]);
  const [termFilter, setTermFilter] = useState('');
  const [allEvaluationsOpen, setAllEvaluationsOpen] = useState(false);
  const [allEvaluationsData, setAllEvaluationsData] = useState(null);
  const [allEvaluationsLoading, setAllEvaluationsLoading] = useState(false);
  const [showPreviousPeriod, setShowPreviousPeriod] = useState(false);
  const [allTeachersSummary, setAllTeachersSummary] = useState(null);

  useEffect(() => {
    if (open) {
      fetchEvaluations();
      fetchTerms();
      // Fetch all teachers summary for "All Evaluations" dialog
      fetchAllTeachersSummary();
      // Also fetch full evaluation data for specific teacher (silent)
      if (teacherId) {
        fetchAllEvaluations(teacherId, true);
      }
    }
  }, [open, teacherId, termFilter]);

  const fetchAllTeachersSummary = async () => {
    // Fetch summary for ALL teachers
    try {
      const token = await GetToken();
      const url = `${Backend.api}performance-criteria/all-teachers-summary/`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAllTeachersSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching all teachers summary:', error);
    }
  };

  const fetchTerms = async () => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.terms}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTerms(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const fetchAllEvaluations = async (tid, silent = false) => {
    if (!silent) setAllEvaluationsLoading(true);
    try {
      const token = await GetToken();
      const url = `${Backend.api}${Backend.performanceAllEvaluations}?teacher_id=${tid}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAllEvaluationsData(data.data);
        if (!silent) setAllEvaluationsOpen(true);
      } else if (!silent) {
        toast.error(data.message || 'Failed to load all evaluations');
      }
    } catch (error) {
      console.error('Error fetching all evaluations:', error);
      if (!silent) toast.error('Failed to load all evaluations');
    } finally {
      if (!silent) setAllEvaluationsLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      let url;

      if (teacherId) {
        url = `${Backend.api}${Backend.performanceEvaluationByTeacher(teacherId)}`;
      } else {
        url = `${Backend.api}${Backend.performanceEvaluations}`;
      }

      // Add term filter only
      if (termFilter) url += `?term=${termFilter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEvaluations(data.data || []);
      } else {
        toast.error(data.message || 'Failed to load evaluations');
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast.error('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, action) => {
    try {
      const token = await GetToken();
      let url;
      switch (action) {
        case 'submit':
          url = `${Backend.api}${Backend.performanceEvaluationSubmit(id)}`;
          break;
        case 'review':
          url = `${Backend.api}${Backend.performanceEvaluationReview(id)}`;
          break;
        case 'approve':
          url = `${Backend.api}${Backend.performanceEvaluationApprove(id)}`;
          break;
        default:
          return;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Evaluation ${action}ed successfully`);
        fetchEvaluations();
      } else {
        toast.error(data.message || `Failed to ${action} evaluation`);
      }
    } catch (error) {
      console.error(`Error ${action}ing evaluation:`, error);
      toast.error(`Failed to ${action} evaluation`);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await GetToken();
      const response = await fetch(`${Backend.api}${Backend.performanceEvaluations}${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Evaluation deleted successfully');
        fetchEvaluations();
      } else {
        toast.error(data.message || 'Failed to delete evaluation');
      }
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast.error('Failed to delete evaluation');
    }
    setDeleteConfirm(null);
  };

  const getMeasurementTypeLabel = (type) => {
    const labels = {
      rating_1_5: '1-5 Stars',
      rating_1_10: '1-10 Scale',
      percentage: 'Percentage',
      boolean: 'Yes/No',
      text: 'Text',
      numeric: 'Numeric'
    };
    return labels[type] || type;
  };

  const renderCriteriaRating = (rating, criteria) => {
    const { measurement_type } = criteria;

    switch (measurement_type) {
      case 'rating_1_5':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating value={rating.rating_value || 0} readOnly size="small" />
            <Typography variant="caption" sx={{ ml: 1 }}>
              {rating.rating_value}
            </Typography>
          </Box>
        );
      case 'rating_1_10':
        return (
          <Typography variant="body2">
            {rating.rating_value}/10
          </Typography>
        );
      case 'percentage':
        return (
          <Typography variant="body2">
            {rating.rating_value}%
          </Typography>
        );
      case 'boolean':
        return (
          <Chip
            size="small"
            label={rating.boolean_value ? 'Yes' : 'No'}
            color={rating.boolean_value ? 'success' : 'default'}
          />
        );
      case 'text':
        return rating.text_value ? (
          <Tooltip title={rating.text_value}>
            <Typography variant="body2" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rating.text_value}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        );
      default:
        return <Typography variant="body2">{rating.rating_value}</Typography>;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📊 Review & Recommendations</span>
        <Stack direction="row" spacing={1}>
          {teacherId && (
            <Button
              variant="contained"
              size="small"
              startIcon={<IconEye size={18} />}
              onClick={() => fetchAllEvaluations(teacherId)}
              disabled={allEvaluationsLoading}
            >
              {allEvaluationsLoading ? 'Loading...' : 'View Analytics'}
            </Button>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {/* Filters */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Filters hidden in Admin Review Mode - admin only views, does not filter by status */}
            <Button
              startIcon={<IconRefresh size={18} />}
              onClick={fetchEvaluations}
              disabled={loading}
              size="small"
            >
              Refresh Data
            </Button>
          </Stack>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* All Teachers Summary Table - Filter to show only selected teacher if teacherId provided */}
          {!loading && allTeachersSummary && (
            (() => {
              // Filter to show only selected teacher if teacherId is provided
              const teachersToShow = teacherId
                ? allTeachersSummary.teachers.filter(t => t.teacher_id === teacherId)
                : allTeachersSummary.teachers;

              return (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {allTeachersSummary.evaluation_period?.period_label || 'Current Period'}
                      {allTeachersSummary.evaluation_period?.is_open ? ' (Open)' : ' (Closed)'}
                    </Typography>
                    <Typography variant="body2">
                      {teacherId
                        ? `Showing performance for selected teacher`
                        : `Showing ${allTeachersSummary.total_teachers} teachers with ratings`}
                    </Typography>
                  </Alert>

                  {teachersToShow.length === 0 ? (
                    <Alert severity="info">
                      No ratings found for this teacher in the current period.
                    </Alert>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell><strong>Teacher</strong></TableCell>
                            <TableCell align="center"><strong>Student Score</strong></TableCell>
                            <TableCell align="center"><strong>Parent Score</strong></TableCell>
                            <TableCell align="center"><strong>Other Score</strong></TableCell>
                            <TableCell align="center"><strong>Total Score</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {teachersToShow.map((teacher) => (
                            <TableRow key={teacher.teacher_id} hover>
                              <TableCell>
                                <Typography fontWeight={600}>
                                  {teacher.full_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {teacher.teacher_code} • {teacher.total_ratings} ratings
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                {teacher.student_count > 0 ? (
                                  <Typography fontWeight={700} color="primary">
                                    {teacher.student_score}/100
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {teacher.parent_count > 0 ? (
                                  <Typography fontWeight={700} color="success.main">
                                    {teacher.parent_score}/100
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {teacher.other_count > 0 ? (
                                  <Typography fontWeight={700} color="warning.main">
                                    {teacher.other_score}/100
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight={700} color="primary" variant="h6">
                                  {teacher.overall_score}/100
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              );
            })()
          )}

        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>

      {/* View Evaluation Details Dialog */}
      <Dialog
        open={!!viewingEvaluation}
        onClose={() => setViewingEvaluation(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {viewingEvaluation && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              Evaluation Details
              <Chip
                label={viewingEvaluation.status}
                color={STATUS_COLORS[viewingEvaluation.status] || 'default'}
                size="small"
                sx={{ ml: 2 }}
              />
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                {/* Header Info */}
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">Teacher</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {viewingEvaluation.teacher_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {viewingEvaluation.teacher_id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">Term</Typography>
                        <Typography variant="body1">
                          {viewingEvaluation.term_details?.name} - {viewingEvaluation.academic_year}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">Evaluated By</Typography>
                        <Typography variant="body1">{viewingEvaluation.evaluated_by_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(viewingEvaluation.evaluated_at).format('MMM D, YYYY')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">Scores</Typography>
                        <Typography variant="h6" color="primary">
                          {viewingEvaluation.overall_score || 'N/A'}%
                        </Typography>
                        <Typography variant="caption">
                          Weighted Average: {viewingEvaluation.weighted_average || 'N/A'}/5
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Criteria Ratings */}
                <Typography variant="h6">Criteria Ratings</Typography>
                {viewingEvaluation.criteria_ratings?.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Criteria</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Rating</TableCell>
                          <TableCell>Comment</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingEvaluation.criteria_ratings.map((rating) => (
                          <TableRow key={rating.id}>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {rating.criteria_details?.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={getMeasurementTypeLabel(rating.criteria_details?.measurement_type)}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {renderCriteriaRating(rating, rating.criteria_details)}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {rating.comment || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No criteria ratings found</Alert>
                )}

                {/* Summary Sections */}
                {(viewingEvaluation.strengths || viewingEvaluation.areas_for_improvement) && (
                  <>
                    <Divider />
                    <Grid container spacing={2}>
                      {viewingEvaluation.strengths && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="success.main" gutterBottom>
                            Key Strengths
                          </Typography>
                          <Typography variant="body2">{viewingEvaluation.strengths}</Typography>
                        </Grid>
                      )}
                      {viewingEvaluation.areas_for_improvement && (
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="warning.main" gutterBottom>
                            Areas for Improvement
                          </Typography>
                          <Typography variant="body2">{viewingEvaluation.areas_for_improvement}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </>
                )}

                {viewingEvaluation.recommendations && (
                  <Box>
                    <Typography variant="subtitle2" color="info.main" gutterBottom>
                      Recommendations
                    </Typography>
                    <Typography variant="body2">{viewingEvaluation.recommendations}</Typography>
                  </Box>
                )}

                {viewingEvaluation.action_items && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Action Items
                    </Typography>
                    <Typography variant="body2">{viewingEvaluation.action_items}</Typography>
                  </Box>
                )}

                {/* Review Info */}
                {(viewingEvaluation.reviewed_by_name || viewingEvaluation.approved_by_name) && (
                  <>
                    <Divider />
                    <Typography variant="subtitle2">Review History</Typography>
                    {viewingEvaluation.reviewed_by_name && (
                      <Typography variant="body2">
                        Reviewed by: {viewingEvaluation.reviewed_by_name} on{' '}
                        {dayjs(viewingEvaluation.reviewed_at).format('MMM D, YYYY')}
                      </Typography>
                    )}
                    {viewingEvaluation.approved_by_name && (
                      <Typography variant="body2">
                        Approved by: {viewingEvaluation.approved_by_name} on{' '}
                        {dayjs(viewingEvaluation.approved_at).format('MMM D, YYYY')}
                      </Typography>
                    )}
                  </>
                )}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setViewingEvaluation(null)} color="inherit">
                Close
              </Button>
              {viewingEvaluation.status === 'draft' && (
                <Button
                  onClick={() => {
                    setViewingEvaluation(null);
                    onEdit?.(viewingEvaluation);
                  }}
                  variant="outlined"
                  startIcon={<IconEdit size={18} />}
                >
                  Edit
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this evaluation for{' '}
            <strong>{deleteConfirm?.teacher_name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Term: {deleteConfirm?.term_details?.name} - {deleteConfirm?.academic_year}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteConfirm.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* All Evaluations Comprehensive View Dialog */}
      <Dialog
        open={allEvaluationsOpen}
        onClose={() => setAllEvaluationsOpen(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
      >
        {allEvaluationsLoading ? (
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading evaluation data...</Typography>
          </DialogContent>
        ) : allEvaluationsData ? (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="h5" fontWeight={800}>
                      Complete Evaluation Report
                    </Typography>
                    {/* Evaluation Period Status Label */}
                    {allEvaluationsData.evaluation_period?.is_open ? (
                      <Chip
                        label="Evaluation Open"
                        color="success"
                        size="small"
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <Chip
                        label="Evaluation Closed"
                        color="error"
                        size="small"
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {allEvaluationsData.teacher?.full_name || 'Unknown Teacher'} ({allEvaluationsData.teacher?.teacher_id || 'N/A'})
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setAllEvaluationsOpen(false)}
                >
                  Close
                </Button>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>
                {/* Summary Cards - Show Both Current and Previous Periods */}
                <Box>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    {/* Current Period Card */}
                    <Card sx={{ bgcolor: 'success.light', color: 'white', p: 2, flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="h6" fontWeight={700}>🆕 Current Period</Typography>
                        {allEvaluationsData.evaluation_period?.is_open && (
                          <Chip label="ACTIVE" color="success" size="small" sx={{ bgcolor: 'white', color: 'success.dark', fontWeight: 700 }} />
                        )}
                      </Stack>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="h4" fontWeight={800} align="center">
                            {(allEvaluationsData.current_period?.total_ratings || 0)}
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                            Total Ratings
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h4" fontWeight={800} align="center">
                            {(allEvaluationsData.current_period?.overall_average || 0).toFixed(1)}
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                            Avg / {(allEvaluationsData.current_period?.overall_percentage || 0)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>

                    {/* Previous Period Card - Click to expand */}
                    <Card
                      sx={{
                        bgcolor: allEvaluationsData.previous_period?.total_ratings > 0 ? 'grey.100' : 'grey.50',
                        p: 2,
                        flex: 1,
                        cursor: allEvaluationsData.previous_period?.total_ratings > 0 ? 'pointer' : 'default',
                        border: '2px solid',
                        borderColor: allEvaluationsData.previous_period?.total_ratings > 0 ? 'grey.300' : 'grey.200'
                      }}
                      onClick={() => {
                        if (allEvaluationsData.previous_period?.total_ratings > 0) {
                          // Toggle previous period details view
                          setShowPreviousPeriod(!showPreviousPeriod);
                        }
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="h6" fontWeight={700} color="text.secondary">📅 Previous Period</Typography>
                        <Chip
                          label="STORED"
                          color="default"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                        {allEvaluationsData.previous_period?.total_ratings > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                            {showPreviousPeriod ? '▼ Hide' : '▶ Click to view'}
                          </Typography>
                        )}
                      </Stack>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="h4" fontWeight={800} align="center" color="text.secondary">
                            {(allEvaluationsData.previous_period?.total_ratings || 0)}
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ display: 'block' }} color="text.secondary">
                            Total Ratings
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h4" fontWeight={800} align="center" color="text.secondary">
                            {(allEvaluationsData.previous_period?.overall_average || 0).toFixed(1)}
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ display: 'block' }} color="text.secondary">
                            Avg / {(allEvaluationsData.previous_period?.overall_percentage || 0)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  </Stack>
                </Box>

                <Divider />

                {/* Current Period Evaluations */}
                {allEvaluationsData.current_period_evaluations?.length > 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      🆕 Current Evaluation Period
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Active evaluation period - New ratings and evaluations are being collected
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Term</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Overall Score</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Evaluated By</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {allEvaluationsData.current_period_evaluations.map((evalItem) => (
                            <TableRow key={evalItem.id}>
                              <TableCell>
                                <Chip
                                  label={evalItem.term_name || 'N/A'}
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                  <Chip
                                    label={evalItem.status}
                                    color={STATUS_COLORS[evalItem.status] || 'default'}
                                    size="small"
                                  />
                                  <Chip
                                    label="CURRENT"
                                    color="success"
                                    size="small"
                                    variant="filled"
                                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                  />
                                </Stack>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight={700} color={evalItem.overall_score >= 70 ? 'success.main' : evalItem.overall_score >= 50 ? 'warning.main' : 'error.main'}>
                                  {evalItem.overall_score ? `${evalItem.overall_score}%` : 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Stack alignItems="center" spacing={0.5}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {evalItem.evaluated_by || 'System'}
                                  </Typography>
                                  {evalItem.evaluated_by && (
                                    <Chip
                                      label="Admin Evaluated"
                                      color="info"
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.65rem', height: 20 }}
                                    />
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="caption" color="text.secondary">
                                  {evalItem.evaluated_at ? dayjs(evalItem.evaluated_at).format('MMM D, YYYY') : 'N/A'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Previous Period Evaluations */}
                {allEvaluationsData.previous_period_evaluations?.length > 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      📅 Previous Evaluations by Term
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Historical performance evaluations from closed evaluation periods
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Term</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Overall Score</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Evaluated By</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {allEvaluationsData.previous_period_evaluations.map((evalItem) => (
                            <TableRow key={evalItem.id}>
                              <TableCell>
                                <Chip
                                  label={evalItem.term_name || 'N/A'}
                                  color="default"
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                  <Chip
                                    label={evalItem.status}
                                    color={STATUS_COLORS[evalItem.status] || 'default'}
                                    size="small"
                                  />
                                  <Chip
                                    label="PREVIOUS"
                                    color="default"
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                </Stack>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight={700} color={evalItem.overall_score >= 70 ? 'success.main' : evalItem.overall_score >= 50 ? 'warning.main' : 'error.main'}>
                                  {evalItem.overall_score ? `${evalItem.overall_score}%` : 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Stack alignItems="center" spacing={0.5}>
                                  <Typography variant="body2" fontWeight={600}>
                                    {evalItem.evaluated_by || 'System'}
                                  </Typography>
                                  {evalItem.evaluated_by && (
                                    <Chip
                                      label="Admin Evaluated"
                                      color="info"
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.65rem', height: 20 }}
                                    />
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="caption" color="text.secondary">
                                  {evalItem.evaluated_at ? dayjs(evalItem.evaluated_at).format('MMM D, YYYY') : 'N/A'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                <Divider />

                {/* Criteria Breakdown - Aggregate Only */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                      Criteria Performance Breakdown
                    </Typography>
                    {allEvaluationsData.evaluation_period?.is_open ? (
                      <Chip label="CURRENT PERIOD" color="success" size="small" variant="filled" sx={{ fontWeight: 600 }} />
                    ) : (
                      <Chip label="PREVIOUS PERIOD" color="default" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Aggregate scores from all raters (Students, Parents, Admins) for the {allEvaluationsData.evaluation_period?.is_open ? 'current' : 'previous'} evaluation period.
                    Individual rater breakdowns are not shown for privacy.
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Criteria</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Avg Rating</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Score %</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Total Ratings</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.values(allEvaluationsData.evaluation_period?.is_open
                          ? (allEvaluationsData.current_period?.criteria_breakdown || {})
                          : (allEvaluationsData.previous_period?.criteria_breakdown || {})
                        ).map((criteria) => (
                          <TableRow key={criteria.criteria_code}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {criteria.criteria_name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {criteria.total_ratings > 0 ? (
                                <>
                                  <Rating value={criteria.average_rating} readOnly precision={0.1} size="small" />
                                  <Typography variant="caption" sx={{ display: 'block' }}>
                                    {criteria.average_rating}/5
                                  </Typography>
                                </>
                              ) : (
                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {criteria.total_ratings > 0 ? (
                                <Chip
                                  label={`${criteria.percentage}%`}
                                  color={criteria.percentage >= 80 ? 'success' : criteria.percentage >= 60 ? 'warning' : 'error'}
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  label="N/A"
                                  color="default"
                                  variant="outlined"
                                  size="small"
                                  sx={{ fontStyle: 'italic' }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Typography fontWeight={700} color={criteria.total_ratings > 0 ? 'text.primary' : 'text.secondary'}>
                                {criteria.total_ratings > 0 ? criteria.total_ratings : '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Divider />

                {/* Previous Period Details - Expandable */}
                {showPreviousPeriod && allEvaluationsData.previous_period?.total_ratings > 0 && (
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight={700} color="text.secondary">
                        📅 Previous Period Details
                      </Typography>
                      <Chip label="STORED DATA" color="default" size="small" variant="outlined" />
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ ml: 'auto' }}
                        onClick={() => setShowPreviousPeriod(false)}
                      >
                        Hide
                      </Button>
                    </Stack>

                    {/* Previous Period Stats */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ bgcolor: 'white', p: 1.5 }}>
                          <Typography variant="h5" fontWeight={700} align="center" color="text.secondary">
                            {(allEvaluationsData.previous_period?.overall_average || 0).toFixed(1)}
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ display: 'block' }} color="text.secondary">
                            Avg / {(allEvaluationsData.previous_period?.overall_percentage || 0)}%
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ bgcolor: 'white', p: 1.5 }}>
                          <Typography variant="h5" fontWeight={700} align="center" color="text.secondary">
                            {allEvaluationsData.previous_period?.student_ratings_count || 0}
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ display: 'block' }} color="text.secondary">
                            Student Ratings
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ bgcolor: 'white', p: 1.5 }}>
                          <Typography variant="h5" fontWeight={700} align="center" color="text.secondary">
                            {allEvaluationsData.previous_period?.parent_ratings_count || 0}
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ display: 'block' }} color="text.secondary">
                            Parent Ratings
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card sx={{ bgcolor: 'white', p: 1.5 }}>
                          <Typography variant="h5" fontWeight={700} align="center" color="text.secondary">
                            {allEvaluationsData.previous_period?.total_ratings || 0}
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ display: 'block' }} color="text.secondary">
                            Total Ratings
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Previous Period Criteria Breakdown */}
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                      Previous Period Criteria Performance
                    </Typography>
                    <TableContainer component={Card} sx={{ bgcolor: 'white' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Criteria</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Avg Rating</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Score %</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.values(allEvaluationsData.previous_period?.criteria_breakdown || {}).map((criteria) => (
                            <TableRow key={`prev-${criteria.criteria_code}`}>
                              <TableCell>
                                <Typography variant="body2">{criteria.criteria_name}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                {criteria.total_ratings > 0 ? (
                                  <>
                                    <Rating value={criteria.average_rating} readOnly precision={0.1} size="small" />
                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                      {criteria.average_rating}/5
                                    </Typography>
                                  </>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {criteria.total_ratings > 0 ? (
                                  <Chip
                                    label={`${criteria.percentage}%`}
                                    color={criteria.percentage >= 80 ? 'success' : criteria.percentage >= 60 ? 'warning' : 'error'}
                                    size="small"
                                  />
                                ) : (
                                  <Chip label="N/A" color="default" variant="outlined" size="small" sx={{ fontStyle: 'italic' }} />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Typography color="text.secondary">{criteria.total_ratings || '-'}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Previous Period Individual Ratings */}
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                      Previous Period Individual Ratings ({allEvaluationsData.previous_period?.ratings?.length || 0} total)
                    </Typography>
                    <TableContainer component={Card} sx={{ bgcolor: 'white', maxHeight: 300 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Rated By</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Criteria</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Comment</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {allEvaluationsData.previous_period?.ratings?.map((rating) => (
                            <TableRow key={`prev-rating-${rating.id}`}>
                              <TableCell>
                                {dayjs(rating.rating_date).format('MMM D, YYYY')}
                              </TableCell>
                              <TableCell>
                                {rating.rated_by_role === 'Admin' && rating.rated_by_name ? (
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                      {rating.rated_by_name}
                                    </Typography>
                                    <Chip label="Admin" size="small" color="warning" variant="outlined" />
                                  </Box>
                                ) : (
                                  <Chip
                                    label={rating.rated_by_role}
                                    size="small"
                                    color={rating.rated_by_role === 'Student' ? 'success' : rating.rated_by_role === 'Parent' ? 'info' : 'warning'}
                                    variant="outlined"
                                  />
                                )}
                              </TableCell>
                              <TableCell>{rating.category}</TableCell>
                              <TableCell>
                                <Rating value={rating.rating} readOnly size="small" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                                  {rating.comment || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!allEvaluationsData.previous_period?.ratings || allEvaluationsData.previous_period.ratings.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                  No individual ratings recorded for previous period
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                )}

                {/* Admin Recommendations - Only show if admin recommendations exist */}
                {allEvaluationsData.admin_recommendations && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {allEvaluationsData.evaluation_period?.is_open ? '🆕 New Admin Evaluation & Recommendations' : '📋 Previous Admin Evaluation & Recommendations'}
                      {allEvaluationsData.admin_recommendations?.evaluated_by && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          by {allEvaluationsData.admin_recommendations.evaluated_by} ({allEvaluationsData.admin_recommendations.term_name})
                        </Typography>
                      )}
                    </Typography>

                    <Grid container spacing={2}>
                      {/* Strengths from Admin */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.light' }}>
                          <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight={700} color="success.dark">
                                ✅ Strengths (Admin Assessment)
                              </Typography>
                              {!allEvaluationsData.evaluation_period?.is_open && (
                                <Chip label="PREVIOUS" size="small" color="default" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                              )}
                              {allEvaluationsData.evaluation_period?.is_open && (
                                <Chip label="CURRENT" size="small" color="success" variant="filled" sx={{ fontSize: '0.7rem' }} />
                              )}
                            </Stack>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {allEvaluationsData.admin_recommendations.strengths || 'No strengths documented by admin.'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Areas for Improvement from Admin */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light' }}>
                          <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight={700} color="error.dark">
                                ⚠️ Areas for Improvement (Admin Assessment)
                              </Typography>
                              {!allEvaluationsData.evaluation_period?.is_open && (
                                <Chip label="PREVIOUS" size="small" color="default" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                              )}
                              {allEvaluationsData.evaluation_period?.is_open && (
                                <Chip label="CURRENT" size="small" color="success" variant="filled" sx={{ fontSize: '0.7rem' }} />
                              )}
                            </Stack>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {allEvaluationsData.admin_recommendations.areas_for_improvement || 'No areas for improvement documented by admin.'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Recommendations */}
                      <Grid item xs={12}>
                        <Card sx={{ bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.light' }}>
                          <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight={700} color="info.dark">
                                💡 Recommendations for Growth
                              </Typography>
                              {!allEvaluationsData.evaluation_period?.is_open && (
                                <Chip label="PREVIOUS" size="small" color="default" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                              )}
                              {allEvaluationsData.evaluation_period?.is_open && (
                                <Chip label="CURRENT" size="small" color="success" variant="filled" sx={{ fontSize: '0.7rem' }} />
                              )}
                            </Stack>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {allEvaluationsData.admin_recommendations.recommendations || 'No recommendations provided by admin.'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Action Items */}
                      {allEvaluationsData.admin_recommendations.action_items && (
                        <Grid item xs={12}>
                          <Card sx={{ bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.light' }}>
                            <CardContent>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight={700} color="warning.dark">
                                  🎯 Action Items
                                </Typography>
                                {!allEvaluationsData.evaluation_period?.is_open && (
                                  <Chip label="PREVIOUS" size="small" color="default" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                )}
                                {allEvaluationsData.evaluation_period?.is_open && (
                                  <Chip label="CURRENT" size="small" color="success" variant="filled" sx={{ fontSize: '0.7rem' }} />
                                )}
                              </Stack>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {allEvaluationsData.admin_recommendations.action_items}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                    </Grid>

                    <Divider />
                  </Box>
                )}

                {/* Recent Ratings - Anonymous */}
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Recent Ratings (Anonymous - Role Only)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Student and parent names are hidden for privacy. Ratings are labeled by evaluation period (Current/Previous).
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Rated By</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Criteria</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Comment</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allEvaluationsData.recent_ratings.map((rating) => (
                          <TableRow key={rating.id}>
                            <TableCell>
                              {dayjs(rating.rating_date).format('MMM D, YYYY')}
                            </TableCell>
                            <TableCell>
                              {/* Show admin name if available, otherwise just role for privacy */}
                              {rating.rated_by_role === 'Admin' && rating.rated_by_name ? (
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {rating.rated_by_name}
                                  </Typography>
                                  <Chip label="Admin" size="small" color="warning" variant="outlined" />
                                </Box>
                              ) : (
                                <Chip
                                  label={rating.rated_by_role}
                                  size="small"
                                  color={rating.rated_by_role === 'Student' ? 'success' : rating.rated_by_role === 'Parent' ? 'info' : 'warning'}
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {rating.is_previous_period ? (
                                <Chip label="PREVIOUS" size="small" color="default" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                              ) : (
                                <Chip label="CURRENT" size="small" color="success" variant="filled" sx={{ fontSize: '0.7rem' }} />
                              )}
                            </TableCell>
                            <TableCell>{rating.category}</TableCell>
                            <TableCell>
                              <Rating value={rating.rating} readOnly size="small" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                                {rating.comment || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            </DialogContent>
          </>
        ) : (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load evaluation data
            </Alert>
            <Button
              variant="contained"
              onClick={() => fetchAllEvaluations(teacherId)}
              startIcon={<IconRefresh size={18} />}
            >
              Retry
            </Button>
          </DialogContent>
        )}
      </Dialog>
    </Dialog>
  );
};

export default EvaluationsList;
