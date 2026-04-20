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

  useEffect(() => {
    if (open) {
      fetchEvaluations();
      fetchTerms();
    }
  }, [open, teacherId, termFilter]);

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

  const fetchAllEvaluations = async (tid) => {
    setAllEvaluationsLoading(true);
    try {
      const token = await GetToken();
      const url = `${Backend.api}${Backend.performanceAllEvaluations}?teacher_id=${tid}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAllEvaluationsData(data.data);
        setAllEvaluationsOpen(true);
      } else {
        toast.error(data.message || 'Failed to load all evaluations');
      }
    } catch (error) {
      console.error('Error fetching all evaluations:', error);
      toast.error('Failed to load all evaluations');
    } finally {
      setAllEvaluationsLoading(false);
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
              {allEvaluationsLoading ? 'Loading...' : 'View Full Analysis'}
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

          {/* Review Info - Admin reviews student/parent ratings, does not create evaluations */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600}>
              Admin Review Mode
            </Typography>
            <Typography variant="body2">
              reviews teacher performance based on student and parent ratings only.
              Click "View Full Analysis" to see aggregate ratings, strengths, weaknesses, and provide recommendations.
            </Typography>
          </Alert>

          {/* Admin Review Mode - No formal evaluations table, just info */}
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body1" fontWeight={700} gutterBottom>
              ✅ Admin Review Mode Active
            </Typography>
            <Typography variant="body2" paragraph>
              Super Admin/Admin reviews teacher performance based on student and parent ratings only.
              You cannot create formal evaluations - you can only review existing ratings and provide recommendations.
            </Typography>
            <Typography variant="body2">
              <strong>To review a teacher:</strong>
            </Typography>
            <Typography component="div" variant="body2" sx={{ pl: 2, mt: 1 }}>
              • Click <strong>"View Full Analysis"</strong> button above<br />
              • See aggregate ratings from students/parents (names hidden for privacy)<br />
              • View strengths, weaknesses, and provide recommendations<br />
              • See recent anonymous ratings by role (Student/Parent/Admin)
            </Typography>
          </Alert>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
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
                  <Typography variant="h5" fontWeight={800}>
                    Complete Evaluation Report
                  </Typography>
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
                {/* Summary Cards */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'primary.light', color: 'white', p: 2 }}>
                      <Typography variant="h4" fontWeight={800} align="center">
                        {allEvaluationsData.summary.overall_average.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                        Overall Average
                      </Typography>
                      <Typography variant="h6" fontWeight={700} align="center">
                        {allEvaluationsData.summary.overall_percentage}%
                      </Typography>
                    </Card>
                  </Grid>
                  {/* Ratings by Rater Type */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'success.light', color: 'white', p: 2 }}>
                      <Typography variant="h4" fontWeight={800} align="center">
                        {allEvaluationsData.summary.student_ratings_count || 0}
                      </Typography>
                      <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                        Student Ratings
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'info.light', color: 'white', p: 2 }}>
                      <Typography variant="h4" fontWeight={800} align="center">
                        {allEvaluationsData.summary.parent_ratings_count || 0}
                      </Typography>
                      <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                        Parent Ratings
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'warning.light', color: 'white', p: 2 }}>
                      <Typography variant="h4" fontWeight={800} align="center">
                        {allEvaluationsData.summary.admin_ratings_count || 0}
                      </Typography>
                      <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                        Admin Ratings
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                {/* Second Row - Totals */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: 'secondary.light', color: 'white', p: 2 }}>
                      <Typography variant="h4" fontWeight={800} align="center">
                        {allEvaluationsData.summary.total_ratings}
                      </Typography>
                      <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                        Total Ratings Received
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: 'primary.light', color: 'white', p: 2 }}>
                      <Typography variant="h4" fontWeight={800} align="center">
                        {Object.keys(allEvaluationsData.criteria_breakdown).length}
                      </Typography>
                      <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                        Criteria Measured
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: 'grey.500', color: 'white', p: 2 }}>
                      <Typography variant="h4" fontWeight={800} align="center">
                        {allEvaluationsData.summary.evaluation_count}
                      </Typography>
                      <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                        Formal Evaluations
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                <Divider />

                {/* Criteria Breakdown - Aggregate Only */}
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Criteria Performance Breakdown
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Aggregate scores from all raters (Students, Parents, Admins). Individual rater breakdowns are not shown for privacy.
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
                        {Object.values(allEvaluationsData.criteria_breakdown).map((criteria) => (
                          <TableRow key={criteria.criteria_code}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {criteria.criteria_name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Rating value={criteria.average_rating} readOnly precision={0.1} size="small" />
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                {criteria.average_rating}/5
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${criteria.percentage}%`}
                                color={criteria.percentage >= 80 ? 'success' : criteria.percentage >= 60 ? 'warning' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography fontWeight={700}>{criteria.total_ratings}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Divider />

                {/* Admin/Super Admin Recommendations */}
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    � Admin Evaluation & Recommendations
                    {allEvaluationsData.admin_recommendations?.evaluated_by && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        by {allEvaluationsData.admin_recommendations.evaluated_by} ({allEvaluationsData.admin_recommendations.term_name})
                      </Typography>
                    )}
                  </Typography>

                  {allEvaluationsData.admin_recommendations ? (
                    <Grid container spacing={2}>
                      {/* Strengths from Admin */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.light' }}>
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight={700} color="success.dark" gutterBottom>
                              ✅ Strengths (Admin Assessment)
                            </Typography>
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
                            <Typography variant="subtitle1" fontWeight={700} color="error.dark" gutterBottom>
                              ⚠️ Areas for Improvement (Admin Assessment)
                            </Typography>
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
                            <Typography variant="subtitle1" fontWeight={700} color="info.dark" gutterBottom>
                              � Recommendations for Growth
                            </Typography>
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
                              <Typography variant="subtitle1" fontWeight={700} color="warning.dark" gutterBottom>
                                🎯 Action Items
                              </Typography>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {allEvaluationsData.admin_recommendations.action_items}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      )}
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      No formal evaluation has been created by admin yet. Create an evaluation to provide structured feedback and recommendations for this teacher.
                    </Alert>
                  )}
                </Box>

                <Divider />

                {/* Recent Ratings - Anonymous */}
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Recent Ratings (Anonymous - Role Only)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Student and parent names are hidden for privacy. Only their role and rating criteria are displayed.
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
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
