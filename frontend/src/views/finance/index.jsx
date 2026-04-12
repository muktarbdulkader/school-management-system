import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Button,
  IconButton, LinearProgress, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Tooltip
} from '@mui/material';
import {
  IconCoin, IconTrendingUp, IconTrendingDown, IconRefresh, IconDownload,
  IconShoppingCart, IconFileText, IconAlertCircle, IconCheck, IconX,
  IconCircleCheck
} from '@tabler/icons-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend } from 'recharts';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function FinanceOverviewPage() {
  const [statistics, setStatistics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openApproval, setOpenApproval] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalData, setApprovalData] = useState({ status: 'approved', rejection_reason: '', notes: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await GetToken();
      
      // Fetch resource request statistics
      const [statsRes, requestsRes] = await Promise.allSettled([
        fetch(`${Backend.api}${Backend.resourceRequestsStatistics}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${Backend.api}${Backend.resourceRequests}?limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const data = await statsRes.value.json();
        setStatistics(data.data || data);
      }

      if (requestsRes.status === 'fulfilled' && requestsRes.value.ok) {
        const data = await requestsRes.value.json();
        setRequests(data.data || data.results || []);
      }
    } catch (error) {
      toast.error('Failed to load finance data');
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
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

  const handleApproveReject = (request) => {
    setSelectedRequest(request);
    setApprovalData({ status: 'approved', rejection_reason: '', notes: '' });
    setOpenApproval(true);
  };

  const submitApproval = async () => {
    try {
      const token = await GetToken();
      const endpoint = Backend.resourceRequestApprove.replace('{id}', selectedRequest.id);
      
      const response = await fetch(`${Backend.api}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(approvalData)
      });

      if (response.ok) {
        toast.success(`Request ${approvalData.status} successfully`);
        setOpenApproval(false);
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process request');
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Mark this request as completed?')) return;

    try {
      const token = await GetToken();
      const endpoint = Backend.resourceRequestComplete.replace('{id}', id);
      
      const response = await fetch(`${Backend.api}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Request marked as completed');
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to complete request');
      }
    } catch (error) {
      console.error('Error completing request:', error);
      toast.error('Failed to complete request');
    }
  };

  // Prepare chart data
  const statusChartData = statistics ? [
    { name: 'Pending', value: statistics.pending || 0 },
    { name: 'Approved', value: statistics.approved || 0 },
    { name: 'Rejected', value: statistics.rejected || 0 },
    { name: 'Completed', value: statistics.completed || 0 }
  ].filter(item => item.value > 0) : [];

  const typeChartData = statistics?.by_type ? Object.entries(statistics.by_type).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: value
  })) : [];

  return (
    <PageContainer title="Finance Overview">
      <Box>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3">Finance Overview</Typography>
            <Typography variant="body2" color="text.secondary">
              Resource requests, expenses, and financial analytics
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={18} />}
              onClick={fetchData}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconDownload size={18} />}
              onClick={() => navigate('/data-export')}
            >
              Export Data
            </Button>
            <Button
              variant="contained"
              startIcon={<IconShoppingCart size={18} />}
              onClick={() => navigate('/resource-requests')}
            >
              View All Requests
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <ActivityIndicator size={32} />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <DrogaCard>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconFileText size={24} color="#1976d2" />
                    </Box>
                    <Box>
                      <Typography variant="h3" color="primary">
                        {statistics?.total || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Requests
                      </Typography>
                    </Box>
                  </Stack>
                </DrogaCard>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <DrogaCard>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'warning.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconAlertCircle size={24} color="#f57c00" />
                    </Box>
                    <Box>
                      <Typography variant="h3" color="warning.main">
                        {statistics?.pending || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Approval
                      </Typography>
                    </Box>
                  </Stack>
                </DrogaCard>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <DrogaCard>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'success.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconCheck size={24} color="#2e7d32" />
                    </Box>
                    <Box>
                      <Typography variant="h3" color="success.main">
                        {statistics?.approved || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Approved
                      </Typography>
                    </Box>
                  </Stack>
                </DrogaCard>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <DrogaCard>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'info.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <IconCoin size={24} color="#0288d1" />
                    </Box>
                    <Box>
                      <Typography variant="h3" color="info.main">
                        {statistics?.completed || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Stack>
                </DrogaCard>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <DrogaCard>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Request Status Distribution
                  </Typography>
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                      No data available
                    </Typography>
                  )}
                </DrogaCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <DrogaCard>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Requests by Type
                  </Typography>
                  {typeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={typeChartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                      No data available
                    </Typography>
                  )}
                </DrogaCard>
              </Grid>
            </Grid>

            {/* Recent Requests */}
            <DrogaCard>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4">Recent Resource Requests</Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/resource-requests')}
                >
                  View All
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Requested By</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No recent requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.slice(0, 10).map((request) => (
                        <TableRow key={request.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {request.title || 'No Title'}
                            </Typography>
                            {request.description && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {request.description.substring(0, 50)}
                                {request.description.length > 50 ? '...' : ''}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.request_type_display || request.request_type || 'N/A'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.priority_display || request.priority || 'N/A'}
                              size="small"
                              color={getPriorityColor(request.priority)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.status_display || request.status || 'N/A'}
                              size="small"
                              color={getStatusColor(request.status)}
                            />
                          </TableCell>
                          <TableCell>
                            {request.requested_by_details?.full_name || request.requested_by_name || '—'}
                          </TableCell>
                          <TableCell>
                            {request.created_at
                              ? new Date(request.created_at).toLocaleDateString()
                              : '—'}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                              {request.status === 'pending' && (
                                <Tooltip title="Approve/Reject">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleApproveReject(request)}
                                  >
                                    <IconCheck size={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {request.status === 'approved' && (
                                <Tooltip title="Mark Complete">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleComplete(request.id)}
                                  >
                                    <IconCircleCheck size={18} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {!request.status || request.status === 'pending' || request.status === 'approved' ? (
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => navigate('/resource-requests')}
                                  >
                                    <IconFileText size={18} />
                                  </IconButton>
                                </Tooltip>
                              ) : null}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </DrogaCard>

            {/* Budget Summary (Placeholder for future implementation) */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <DrogaCard>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Monthly Budget
                  </Typography>
                  <Typography variant="h3" color="primary" sx={{ mb: 1 }}>
                    —
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Budget tracking coming soon
                  </Typography>
                </DrogaCard>
              </Grid>

              <Grid item xs={12} md={4}>
                <DrogaCard>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Total Expenses
                  </Typography>
                  <Typography variant="h3" color="error.main" sx={{ mb: 1 }}>
                    —
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expense tracking coming soon
                  </Typography>
                </DrogaCard>
              </Grid>

              <Grid item xs={12} md={4}>
                <DrogaCard>
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    Remaining Budget
                  </Typography>
                  <Typography variant="h3" color="success.main" sx={{ mb: 1 }}>
                    —
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Budget tracking coming soon
                  </Typography>
                </DrogaCard>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      {/* Approval Dialog */}
      <Dialog open={openApproval} onClose={() => setOpenApproval(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve/Reject Resource Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Request Details:</Typography>
              <Typography variant="body1" fontWeight={600}>{selectedRequest.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedRequest.description}
              </Typography>
            </Box>
          )}
          
          <TextField
            select
            fullWidth
            label="Decision *"
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
              label="Rejection Reason *"
              value={approvalData.rejection_reason}
              onChange={(e) => setApprovalData({ ...approvalData, rejection_reason: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
          )}
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={approvalData.notes}
            onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
            helperText="Add any additional comments or instructions"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproval(false)}>Cancel</Button>
          <Button 
            onClick={submitApproval} 
            variant="contained"
            color={approvalData.status === 'approved' ? 'success' : 'error'}
          >
            {approvalData.status === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

export default FinanceOverviewPage;
