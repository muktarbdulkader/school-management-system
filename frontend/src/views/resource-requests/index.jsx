import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
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
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  CheckCircle
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import Backend from '../../services/backend';
import ResourceRequestForm from './components/ResourceRequestForm';

const ResourceRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openApproval, setOpenApproval] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalData, setApprovalData] = useState({ status: 'approved', rejection_reason: '', notes: '' });
  const [filters, setFilters] = useState({ status: '', request_type: '', priority: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = useSelector((state) => state.user);
  const userRole = user?.role?.name?.toLowerCase();
  const userRoles = user?.user?.roles || [];

  // Check if user has admin-like roles
  const isAdmin = user?.user?.is_superuser ||
    user?.user?.is_staff ||
    userRole === 'admin' ||
    userRole === 'administrator' ||
    userRoles.some(role => {
      const roleName = typeof role === 'string' ? role : role?.name;
      return roleName && ['admin', 'super_admin', 'head_admin', 'ceo', 'superadmin'].includes(roleName.toLowerCase());
    });

  useEffect(() => {
    fetchRequests();
    fetchStatistics();
  }, [filters]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.request_type) params.request_type = filters.request_type;
      if (filters.priority) params.priority = filters.priority;

      // Always use the main endpoint - backend will filter based on user permissions
      const endpoint = Backend.resourceRequests;

      const response = await api.get(`${Backend.api}${endpoint}`, { params });

      // Handle different response structures
      let requestsData = [];
      if (response.data?.data) {
        requestsData = response.data.data;
      } else if (response.data?.results) {
        requestsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        requestsData = response.data;
      }

      setRequests(Array.isArray(requestsData) ? requestsData : []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      const errorMsg = error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Failed to load resource requests';
      setError(errorMsg);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!isAdmin) return;

    try {
      const response = await api.get(`${Backend.api}${Backend.resourceRequestsStatistics}`);
      const statsData = response.data?.data || response.data;
      setStatistics(statsData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleCreateRequest = () => {
    setSelectedRequest(null);
    setOpenForm(true);
  };

  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setOpenForm(true);
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    try {
      setError('');
      await api.delete(`${Backend.api}${Backend.resourceRequests}${id}/`);
      setSuccess('Request deleted successfully');
      await fetchRequests();
      if (isAdmin) {
        await fetchStatistics();
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      setError(error.response?.data?.message || 'Failed to delete request');
    }
  };

  const handleApproveReject = (request) => {
    setSelectedRequest(request);
    setApprovalData({ status: 'approved', rejection_reason: '', notes: '' });
    setOpenApproval(true);
  };

  const submitApproval = async () => {
    if (approvalData.status === 'rejected' && !approvalData.rejection_reason.trim()) {
      setError('Rejection reason is required when rejecting a request');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const endpoint = Backend.resourceRequestApprove.replace('{id}', selectedRequest.id);

      console.log('Submitting approval:', approvalData);
      console.log('Endpoint:', `${Backend.api}${endpoint}`);

      const response = await api.post(`${Backend.api}${endpoint}`, approvalData);

      console.log('Approval response:', response.data);

      if (response.data?.success !== false) {
        setSuccess(`Request ${approvalData.status} successfully`);
        setOpenApproval(false);
        setSelectedRequest(null);
        setApprovalData({ status: 'approved', rejection_reason: '', notes: '' });

        // Force refresh data
        setTimeout(async () => {
          await fetchRequests();
          if (isAdmin) {
            await fetchStatistics();
          }
        }, 500);
      } else {
        setError(response.data?.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || error.message || 'Failed to process request');
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Mark this request as completed?')) return;

    try {
      setError('');
      const endpoint = Backend.resourceRequestComplete.replace('{id}', id);

      const response = await api.post(`${Backend.api}${endpoint}`);

      if (response.data?.success !== false) {
        setSuccess('Request marked as completed');
        await fetchRequests();
        await fetchStatistics();
      } else {
        setError(response.data?.message || 'Failed to complete request');
      }
    } catch (error) {
      console.error('Error completing request:', error);
      setError(error.response?.data?.message || 'Failed to complete request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      completed: 'info',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'error'
    };
    return colors[priority] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Resource Requests</Typography>
        {!isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateRequest}
          >
            New Request
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {isAdmin && statistics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total</Typography>
                <Typography variant="h4">{statistics.total || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Pending</Typography>
                <Typography variant="h4" color="warning.main">{statistics.pending || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Approved</Typography>
                <Typography variant="h4" color="success.main">{statistics.approved || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Rejected</Typography>
                <Typography variant="h4" color="error.main">{statistics.rejected || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Completed</Typography>
                <Typography variant="h4" color="info.main">{statistics.completed || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Request Type"
                value={filters.request_type}
                onChange={(e) => setFilters({ ...filters, request_type: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="supplies">Office Supplies</MenuItem>
                <MenuItem value="exam_duplication">Exam Duplication</MenuItem>
                <MenuItem value="equipment">Equipment</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Needed By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No resource requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>{request.request_type_display}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.priority_display}
                        color={getPriorityColor(request.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status_display}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{request.requested_by_name}</TableCell>
                    <TableCell>{request.class_name || request.class_grade || 'N/A'}</TableCell>
                    <TableCell>{request.needed_by || 'N/A'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Non-admin users can edit and delete their own pending requests */}
                        {!isAdmin && request.status === 'pending' && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditRequest(request)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteRequest(request.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        {/* Admin users can approve/reject pending requests */}
                        {isAdmin && request.status === 'pending' && (
                          <Tooltip title="Approve/Reject">
                            <IconButton size="small" color="primary" onClick={() => handleApproveReject(request)}>
                              <ApproveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Admin users can mark approved requests as complete */}
                        {isAdmin && request.status === 'approved' && (
                          <Tooltip title="Mark Complete">
                            <IconButton size="small" color="success" onClick={() => handleComplete(request.id)}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ResourceRequestForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        request={selectedRequest}
        onSuccess={async () => {
          setOpenForm(false);
          setSuccess(selectedRequest ? 'Request updated successfully' : 'Request created successfully');
          await fetchRequests();
          if (isAdmin) {
            await fetchStatistics();
          }
        }}
      />

      <Dialog open={openApproval} onClose={() => setOpenApproval(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve/Reject Request</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Decision"
            value={approvalData.status}
            onChange={(e) => setApprovalData({ ...approvalData, status: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          >
            <MenuItem value="approved">Approve</MenuItem>
            <MenuItem value="rejected">Reject</MenuItem>
          </TextField>

          {approvalData.status === 'rejected' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              value={approvalData.rejection_reason}
              onChange={(e) => setApprovalData({ ...approvalData, rejection_reason: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={approvalData.notes}
            onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproval(false)}>Cancel</Button>
          <Button onClick={submitApproval} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourceRequestsPage;
