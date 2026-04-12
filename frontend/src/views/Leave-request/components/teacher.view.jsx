import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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
  Stack,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import dayjs from 'dayjs';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

/**
 * TeacherPendingLeaves
 *
 * Teacher-facing component to view pending leave requests and approve/reject them.
 * - GET /api/leave_requests/pending_leaves/
 * - POST /api/leave_requests/{id}/approve_leave/  -> { status: 'approved' }
 * - POST /api/leave_requests/{id}/reject_leave/   -> { status: 'rejected' }
 * - GET /api/leave_requests/student_leaves/{studentId}/  -> view student history
 *
 * Props:
 * - baseUrl: string (optional)
 */
export default function TeacherPendingLeaves() {;

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve' | 'reject', id }

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyStudentId, setHistoryStudentId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await GetToken();
      const url = `${Backend.api}${Backend.PendingLeavesRequests}`;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await axios.get(url, { headers });
      const data = Array.isArray(res.data.data) ? res.data.data : res.data?.results || [];
      setPending(data);
    } catch (err) {
      setError(err?.response?.data || err.message || 'Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (type, id) => {
    setConfirmAction({ type, id });
    setConfirmOpen(true);
  };
  const closeConfirm = () => {
    setConfirmAction(null);
    setConfirmOpen(false);
  };

  const performAction = async () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    setActionLoading(true);
    try {
      const token = await GetToken();
      const url = `${Backend.api}${Backend.leaveRequests}${id}/${type === 'approve' ? 'approve_leave' : 'reject_leave'}/`;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const body = { status: type === 'approve' ? 'approved' : 'rejected' };
      await axios.post(url, body, { headers });
      setSnack({ open: true, severity: 'success', message: `Request ${type === 'approve' ? 'approved' : 'rejected'}` });
      // remove from list locally
      setPending((prev) => prev.filter((p) => (p.id || p.leave_request_id) !== id));
    } catch (err) {
      setSnack({ open: true, severity: 'error', message: err?.response?.data || err.message || 'Action failed' });
    } finally {
      setActionLoading(false);
      closeConfirm();
    }
  };

  const openHistory = async (studentId) => {
    console.log('Opening history for student ID:', studentId);
    setHistoryStudentId(studentId);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const token = await GetToken();
      const url = `${Backend.api}${Backend.leaveRequests}student_leaves/${studentId}/`;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await axios.get(url, { headers });
      const data = Array.isArray(res.data.data) ? res.data.data : res.data?.results || [];
      setHistory(data);
    } catch (err) {
      setHistory([]);
      setSnack({ open: true, severity: 'error', message: err?.response?.data || err.message || 'Failed to load student history' });
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setHistoryStudentId(null);
    setHistory([]);
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
        return 'warning';
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Pending Leave Requests</Typography>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={fetchPending} disabled={loading}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Typography color="error">{String(error)}</Typography>
            <Button onClick={fetchPending} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Box>
        ) : pending.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>No pending leave requests.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Subject / Period</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pending.map((r) => {
                  const id = r.id || r.leave_request_id;
                  const student = r.student_name || (r.student || {}).student_details?.full_name || (r.student || {}).student_details?.name || r.student?.student_details?.student_name || (r.student || {}).student_details || 'Student';
                  return (
                    <TableRow key={id}>
                      <TableCell>{dayjs(r.date).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{student}</TableCell>
                      <TableCell>{r.leave_type}</TableCell>
                      <TableCell>
                        {r.leave_type === 'subject' ? (
                          <div>
                            <div>{r.subject_name || r.subject_id || '—'}</div>
                            <div>{r.period_type === 'all' ? 'All periods' : `Period ${r.period_number}`}</div>
                          </div>
                        ) : (
                          'Full day'
                        )}
                      </TableCell>
                      <TableCell>{r.reason}</TableCell>
                      <TableCell>
                        <Chip label={r.status || r.request_status || 'pending'} color={statusColor(r.status || r.request_status)} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton onClick={() => openHistory(r?.student_details?.id || (r.student || {}).id)} title="View student history">
                            <VisibilityIcon />
                          </IconButton>
                          <Button
                            startIcon={<ThumbDownOffAltIcon />}
                            onClick={() => openConfirm('reject', id)}
                            disabled={actionLoading}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<ThumbUpOffAltIcon />}
                            onClick={() => openConfirm('approve', id)}
                            disabled={actionLoading}
                          >
                            Approve
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={closeConfirm}>
        <DialogTitle>{confirmAction?.type === 'approve' ? 'Approve leave request?' : 'Reject leave request?'}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {confirmAction?.type === 'approve' ? 'approve' : 'reject'} this leave request? This action will update the status for the student.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>No</Button>
          <Button variant="contained" color={confirmAction?.type === 'approve' ? 'primary' : 'error'} onClick={performAction} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={18} /> : confirmAction?.type === 'approve' ? 'Yes, approve' : 'Yes, reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History dialog */}
      <Dialog open={historyOpen} onClose={closeHistory} maxWidth="md" fullWidth>
        <DialogTitle>Student Leave History</DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Typography>No leave history for this student.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Subject/Period</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id || h.leave_request_id || JSON.stringify(h)}>
                      <TableCell>{dayjs(h.date).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{h.leave_type}</TableCell>
                      <TableCell>
                        {h.leave_type === 'subject' ? (h.period_type === 'all' ? 'All periods' : `Period ${h.period_number}`) : 'Full day'}
                      </TableCell>
                      <TableCell>{h.reason}</TableCell>
                      <TableCell>
                        <Chip label={h.status || h.request_status || '—'} color={statusColor(h.status || h.request_status)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeHistory}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

TeacherPendingLeaves.propTypes = {
  baseUrl: PropTypes.string,
};
