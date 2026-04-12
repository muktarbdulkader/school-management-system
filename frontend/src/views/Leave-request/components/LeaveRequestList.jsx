import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Snackbar,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import LeaveRequestForm from './LeaveRequestForm';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import toast from 'react-hot-toast';

/**
 * LeaveRequestList
 *
 * Parent-facing list of leave requests. Allows creating a new request (opens LeaveRequestForm)
 * and cancelling pending leave requests.
 *
 * Props:
 * - baseUrl: string (optional) - API base URL
 */
export default function LeaveRequestList() {
  const studentId = useSelector((state) => state.student?.studentData?.student_details?.id);
  const userId = useSelector((state) => state.user?.user?.id);
  const userRoles = useSelector((state) => state.user?.user?.roles);
  
  // Check if current user is a student or parent
  const normalizedRoles = userRoles?.map((role) => 
    typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()
  ) || [];
  const isStudent = normalizedRoles.includes('student');
  const isParent = normalizedRoles.includes('parent');

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openForm, setOpenForm] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCancelId, setSelectedCancelId] = useState(null);

  const [snack, setSnack] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, isStudent]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const url = `${Backend.api}${Backend.leaveRequests}`;
      const res = await axios.get(url, { headers: header });
      
      // Handle response data structure
      const data = res.data?.data || res.data?.results || (Array.isArray(res.data) ? res.data : []);
      
      // For students, backend returns only their requests
      // For parents, filter by selected student
      let filtered = data;
      if (!isStudent && studentId) {
        filtered = data.filter((r) => {
          const reqStudentId = r?.student_id || r?.student_details?.id || r?.student?.id;
          return reqStudentId === studentId;
        });
      }
      
      setRequests(filtered);
      toast.success('Leave requests loaded');
    } catch (err) {
      const errorMessage = err?.response?.data?.message 
        || err?.response?.data?.error
        || (typeof err?.response?.data === 'string' ? err?.response?.data : null)
        || err.message 
        || 'Failed to load leave requests';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => setOpenForm(true);
  const handleCloseForm = () => setOpenForm(false);

  const handleCreateSuccess = (newRequest) => {
    // refresh list after creation
    fetchRequests();
    setSnack({
      open: true,
      severity: 'success',
      message: 'Leave request created',
    });
  };

  const openCancelConfirm = (id) => {
    setSelectedCancelId(id);
    setConfirmOpen(true);
  };

  const closeCancelConfirm = () => {
    setSelectedCancelId(null);
    setConfirmOpen(false);
  };

  const handleCancel = async () => {
    if (!selectedCancelId) return;
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const url = `${Backend.api}${Backend.leaveRequests}${selectedCancelId}/${Backend.leaveRequestCancel}`;
      await axios.post(url, {}, { headers: header });
      setSnack({
        open: true,
        severity: 'success',
        message: 'Leave request cancelled',
      });
      closeCancelConfirm();
      fetchRequests();
      toast.success('Leave request cancelled');
    } catch (err) {
      const errorMessage = err?.response?.data?.message 
        || err?.response?.data?.error
        || (typeof err?.response?.data === 'string' ? err?.response?.data : null)
        || err.message 
        || 'Failed to cancel';
      setSnack({
        open: true,
        severity: 'error',
        message: errorMessage,
      });
      closeCancelConfirm();
      toast.error(errorMessage);
    }
  };

  const statusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'warning'; // pending
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">My Leave Requests</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchRequests}
            disabled={loading}
          >
            Refresh
          </Button>
          {/* Only students can create leave requests, not parents */}
          {isStudent && (
            <Button variant="contained" onClick={handleOpenForm}>
              New Leave Request
            </Button>
          )}
        </Stack>
      </Stack>

      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={fetchRequests} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>
              {isParent 
                ? 'No leave requests yet for the selected student.' 
                : 'No leave requests yet.'}
            </Typography>
            {/* Only students can create leave requests */}
            {isStudent && (
              <Button variant="outlined" sx={{ mt: 2 }} onClick={handleOpenForm}>
                Create one
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Subject / Period</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {requests.map((r) => (
                  <TableRow
                    key={r.id || r.leave_request_id || JSON.stringify(r)}
                  >
                    <TableCell>{dayjs(r.date).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>{r.leave_type}</TableCell>
                    <TableCell>
                      {r.leave_type === 'subject' ? (
                        <div>
                          <div>{r.subject_name || r.subject_id || '—'}</div>
                          <div>
                            {r.period_type === 'all'
                              ? 'All periods'
                              : `Period ${r.period_number}`}
                          </div>
                        </div>
                      ) : (
                        'Full day'
                      )}
                    </TableCell>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell>
                      <Chip
                        label={r.status || r.request_status || 'pending'}
                        color={statusColor(r.status || r.request_status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        {/* Cancel only when pending */}
                        {(r.status || r.request_status || '').toLowerCase() ===
                          'pending' && (
                          <IconButton
                            onClick={() =>
                              openCancelConfirm(r.id || r.leave_request_id)
                            }
                            title="Cancel request"
                          >
                            <CancelOutlinedIcon />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create form dialog */}
      <LeaveRequestForm
        open={openForm}
        onClose={handleCloseForm}
        onSuccess={handleCreateSuccess}
      />

      {/* Confirm cancel dialog */}
      <Dialog open={confirmOpen} onClose={closeCancelConfirm}>
        <DialogTitle>Cancel leave request?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this pending leave request? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelConfirm}>No</Button>
          <Button variant="contained" color="error" onClick={handleCancel}>
            Yes, cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
