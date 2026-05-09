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
  TextField,
} from '@mui/material';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
 * List of leave requests for students, parents, and teachers.
 * Allows creating a new request (opens LeaveRequestForm)
 * and cancelling pending leave requests.
 *
 * Props:
 * - baseUrl: string (optional) - API base URL
 * - requestType: 'student' | 'teacher' - type of leave requests to show
 * - showPendingApprovals: boolean - if true, show pending requests with approve/reject buttons
 */
export default function LeaveRequestList({ requestType: propRequestType, showPendingApprovals }) {

  const studentId = useSelector((state) => state.student?.studentData?.student_details?.id);
  const userId = useSelector((state) => state.user?.user?.id);
  const userRoles = useSelector((state) => state.user?.user?.roles);
  const userTeacherData = useSelector((state) => state.user?.user?.teacher || state.user?.user?.teacher_profiles);
  const fullUserData = useSelector((state) => state.user?.user);

  // Check user roles
  const normalizedRoles = userRoles?.map((role) =>
    typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()
  ) || [];
  const isStudent = normalizedRoles.includes('student');
  const isParent = normalizedRoles.includes('parent');
  const isTeacher = normalizedRoles.includes('teacher');
  const isSuperAdmin = normalizedRoles.includes('super_admin') || normalizedRoles.includes('superadmin') || fullUserData?.is_superuser;

  // Determine request type
  const effectiveRequestType = propRequestType || (isTeacher ? 'teacher' : 'student');

  // For teachers, use their own teacher ID - try multiple paths
  const effectiveTeacherId = userTeacherData?.id || userTeacherData?.teacher_id || fullUserData?.teacher_id || fullUserData?.teacher?.id;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openForm, setOpenForm] = useState(false);

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedCancelId, setSelectedCancelId] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);

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
      // Add request_type filter to get only relevant requests
      let url = `${Backend.api}${Backend.leaveRequests}?request_type=${effectiveRequestType}`;
      // For teachers, also filter by their teacher_id
      if (effectiveRequestType === 'teacher' && effectiveTeacherId) {
        url += `&teacher_id=${effectiveTeacherId}`;
      }
      const res = await axios.get(url, { headers: header });

      // Handle response data structure
      const data = res.data?.data || res.data?.results || (Array.isArray(res.data) ? res.data : []);

      // For student requests, filter by selected student if parent
      let filtered = data;
      if (effectiveRequestType === 'student' && !isStudent && studentId) {
        filtered = data.filter((r) => {
          const reqStudentId = r?.student_id || r?.student_details?.id || r?.student?.id;
          return reqStudentId === studentId;
        });
      }
      // For teacher requests, filter by current teacher
      if (effectiveRequestType === 'teacher' && isTeacher && effectiveTeacherId) {
        filtered = data.filter((r) => {
          const reqTeacherId = r?.teacher_id || r?.teacher_details?.id || r?.teacher?.id;
          return reqTeacherId === effectiveTeacherId;
        });
      }

      // If showPendingApprovals is true, filter to show ONLY pending requests
      if (showPendingApprovals) {
        filtered = filtered.filter(r => (r.status || '').toLowerCase() === 'pending');
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

  const handleOpenForm = () => {
    console.log('Opening form with effectiveRequestType:', effectiveRequestType, 'isTeacher:', isTeacher);
    setOpenForm(true);
  };
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
    setCancelConfirmOpen(true);
  };

  const closeCancelConfirm = () => {
    setSelectedCancelId(null);
    setCancelConfirmOpen(false);
    setCancelReason('');
  };

  const handleCancel = async () => {
    if (!selectedCancelId) return;
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const url = `${Backend.api}${Backend.leaveRequestCancel.replace('{id}', selectedCancelId)}`;
      await axios.post(url, { cancel_reason: cancelReason }, { headers: header });
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


  const openDeleteConfirm = (id) => {
    setSelectedDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setSelectedDeleteId(null);
    setDeleteConfirmOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedDeleteId) return;
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const url = `${Backend.api}${Backend.leaveRequests}${selectedDeleteId}/`;
      await axios.delete(url, { headers: header });
      setSnack({
        open: true,
        severity: 'success',
        message: 'Leave request deleted successfully',
      });
      fetchRequests();
      toast.success('Leave request deleted successfully');
      closeDeleteConfirm();
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to delete';
      setSnack({
        open: true,
        severity: 'error',
        message: errorMessage,
      });
      toast.error(errorMessage);
      closeDeleteConfirm();
    }
  };

  const handleApprove = async (requestId, status) => {
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const url = `${Backend.api}${Backend.leaveRequests}${requestId}/approve_leave/`;
      await axios.patch(url, { status }, { headers: header });
      setSnack({
        open: true,
        severity: 'success',
        message: `Leave request ${status} successfully`,
      });
      fetchRequests();
      toast.success(`Leave request ${status} successfully`);
    } catch (err) {
      const errorMessage = err?.response?.data?.message
        || err?.response?.data?.error
        || (typeof err?.response?.data === 'string' ? err?.response?.data : null)
        || err.message
        || `Failed to ${status}`;
      setSnack({
        open: true,
        severity: 'error',
        message: errorMessage,
      });
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
        <Typography variant="h6">
          {showPendingApprovals 
            ? 'Student Pending Approvals' 
            : (effectiveRequestType === 'teacher' ? 'My Teacher Leave Requests' : 'My Leave Requests')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchRequests}
            disabled={loading}
          >
            Refresh
          </Button>
          {/* Students and teachers can create leave requests */}
          {(isStudent || isTeacher) && (
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
                : effectiveRequestType === 'teacher'
                  ? 'No teacher leave requests yet.'
                  : 'No leave requests yet.'}
            </Typography>
            {/* Students and teachers can create leave requests */}
            {(isStudent || isTeacher) && !showPendingApprovals && (
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
                  {(showPendingApprovals || isTeacher) && <TableCell>Student</TableCell>}
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
                    {(showPendingApprovals || isTeacher) && (
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {r.request_type === 'teacher' 
                          ? (r.teacher_details?.full_name || r.teacher_details?.user_details?.full_name || 'Teacher')
                          : (r.student_details?.name || r.student_details?.full_name || r.student_details?.user_details?.full_name || '—')
                        }
                      </TableCell>
                    )}
                    <TableCell>
                      {r.subject ? 'Subject' : 'Full day'}
                    </TableCell>
                    <TableCell>
                      {r.subject ? (
                        <div>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {r.subject?.name || r.subject?.code || '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(r.period_type === 'all' || !r.period_number)
                              ? 'All periods'
                              : `Period ${r.period_number}`}
                          </Typography>
                        </div>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell>
                      <Chip
                        label={r.status || r.request_status || 'pending'}
                        color={statusColor(r.status || r.request_status)}
                      />
                      {r.cancel_reason && (isStudent || isParent) && (
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                          Reason: {r.cancel_reason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        {/* Approve/Reject for teachers and admins viewing pending approvals */}
                        {showPendingApprovals && (isTeacher || isSuperAdmin) && (r.status || r.request_status || '').toLowerCase() === 'pending' && (
                          <>
                            <IconButton
                              onClick={() => handleApprove(r.id || r.leave_request_id, 'approved')}
                              title="Approve request"
                              color="success"
                            >
                              <CheckCircleOutlineIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleApprove(r.id || r.leave_request_id, 'rejected')}
                              title="Reject request"
                              color="error"
                            >
                              <BlockIcon />
                            </IconButton>
                          </>
                        )}
                        {/* Cancel only when pending (for own requests) */}
                        {!showPendingApprovals && (r.status || r.request_status || '').toLowerCase() ===
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
                          {isSuperAdmin && (
                            <IconButton
                              onClick={() => openDeleteConfirm(r.id || r.leave_request_id)}
                              title="Delete request"
                              color="error"
                            >
                              <DeleteOutlineIcon />
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
      {console.log('Rendering LeaveRequestForm with requestType:', effectiveRequestType)}
      <LeaveRequestForm
        key={`form-${effectiveRequestType}`}
        open={openForm}
        onClose={handleCloseForm}
        onSuccess={handleCreateSuccess}
        requestType={effectiveRequestType}
      />

      {/* Confirm cancel dialog */}
      <Dialog open={cancelConfirmOpen} onClose={closeCancelConfirm}>
        <DialogTitle>Cancel Leave Request?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to cancel this leave request? This action cannot be undone.</Typography>
          <TextField
            label="Cancellation Reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelConfirm}>No</Button>
          <Button variant="contained" color="error" onClick={handleCancel}>
            Yes, cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog open={deleteConfirmOpen} onClose={closeDeleteConfirm}>
        <DialogTitle>Delete Leave Request?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete this leave request? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm}>No</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Yes, delete
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
