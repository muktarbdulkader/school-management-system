import React, { useEffect, useState } from 'react';
import {
  Box,
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
  MenuItem
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
  const [statusFilter, setStatusFilter] = useState('');
  const [terms, setTerms] = useState([]);
  const [termFilter, setTermFilter] = useState('');

  useEffect(() => {
    if (open) {
      fetchEvaluations();
      fetchTerms();
    }
  }, [open, teacherId, statusFilter, termFilter]);

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

      // Add filters
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (termFilter) params.append('term', termFilter);
      if (params.toString()) url += `?${params.toString()}`;

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
        <span>Performance Evaluations</span>
        {canCreate && (
          <Button
            variant="contained"
            size="small"
            startIcon={<IconPlus size={18} />}
            onClick={() => {
              onClose();
              onCreate?.();
            }}
          >
            Create Evaluation
          </Button>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {/* Filters */}
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="reviewed">Reviewed</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
            </TextField>

            <TextField
              select
              label="Term"
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              sx={{ minWidth: 200 }}
              size="small"
            >
              <MenuItem value="">All Terms</MenuItem>
              {terms.map(t => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name} - {t.academic_year}
                </MenuItem>
              ))}
            </TextField>

            <Button
              startIcon={<IconRefresh size={18} />}
              onClick={fetchEvaluations}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          </Stack>

          {/* Evaluations Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : evaluations.length === 0 ? (
            <Alert severity="info">
              No evaluations found. {teacherId && 'Create an evaluation to get started.'}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {!teacherId && <TableCell>Teacher</TableCell>}
                    <TableCell>Term</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Overall Score</TableCell>
                    <TableCell>Evaluated By</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id} hover>
                      {!teacherId && (
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {evaluation.teacher_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {evaluation.teacher_id}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body2">
                          {evaluation.term_details?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {evaluation.academic_year}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={evaluation.status}
                          color={STATUS_COLORS[evaluation.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {evaluation.overall_score ? `${evaluation.overall_score}%` : 'N/A'}
                          </Typography>
                          {evaluation.weighted_average && (
                            <Typography variant="caption" color="text.secondary">
                              Avg: {evaluation.weighted_average}/5
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {evaluation.evaluated_by_name}
                      </TableCell>
                      <TableCell>
                        {dayjs(evaluation.evaluated_at).format('MMM D, YYYY')}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => setViewingEvaluation(evaluation)}
                              color="primary"
                            >
                              <IconEye size={18} />
                            </IconButton>
                          </Tooltip>

                          {evaluation.status === 'draft' && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => onEdit?.(evaluation)}
                                  color="primary"
                                >
                                  <IconEdit size={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Submit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusChange(evaluation.id, 'submit')}
                                  color="warning"
                                >
                                  <IconSend size={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => setDeleteConfirm(evaluation)}
                                  color="error"
                                >
                                  <IconTrash size={18} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          {evaluation.status === 'submitted' && (
                            <Tooltip title="Review">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(evaluation.id, 'review')}
                                color="info"
                              >
                                <IconCheck size={18} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {evaluation.status === 'reviewed' && (
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(evaluation.id, 'approve')}
                                color="success"
                              >
                                <IconChecks size={18} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
    </Dialog>
  );
};

export default EvaluationsList;
