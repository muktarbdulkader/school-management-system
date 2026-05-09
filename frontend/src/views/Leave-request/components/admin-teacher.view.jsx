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
  Tabs,
  Tab,
} from '@mui/material';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import axios from 'axios';
import dayjs from 'dayjs';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

/**
 * AdminTeacherLeaveRequestsPage
 *
 * Super Admin-facing component to view and approve/reject teacher leave requests.
 * - GET /api/leave_requests/?request_type=teacher
 * - GET /api/leave_requests/pending_teacher_leaves/
 * - POST /api/leave_requests/{id}/approve_leave/  -> { status: 'approved' }
 * - POST /api/lease_requests/{id}/reject_leave/
 */
export default function AdminTeacherLeaveRequestsPage({ onlyPending, showOnlyAll }) {

  const [tab, setTab] = useState(0);
  const [pending, setPending] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'approve' | 'reject', id }

  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [teacherHistory, setTeacherHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);

  const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    fetchPending();
    fetchAllRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e, newVal) => setTab(newVal);

  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await GetToken();
      const url = `${Backend.api}${Backend.PendingTeacherLeavesRequests}`;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await axios.get(url, { headers });
      const data = Array.isArray(res.data.data) ? res.data.data : res.data?.results || [];
      setPending(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load pending teacher leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRequests = async () => {
    try {
      const token = await GetToken();
      // Show all leave requests (both teacher and student) without request_type filter
      const url = `${Backend.api}${Backend.leaveRequests}`;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const res = await axios.get(url, { headers });
      const data = Array.isArray(res.data.data) ? res.data.data : res.data?.results || [];
      setAllRequests(data);
    } catch (err) {
      console.error('Failed to load all leave requests:', err);
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
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const body = { status: type === 'approve' ? 'approved' : 'rejected' };
      if (type === 'approve') {
        const url = `${Backend.api}leave_requests/${id}/approve_leave/`;
        await axios.patch(url, body, { headers });
      } else {
        const url = `${Backend.api}leave_requests/${id}/reject_leave/`;
        await axios.post(url, body, { headers });
      }
      setSnack({ open: true, severity: 'success', message: `Request ${type === 'approve' ? 'approved' : 'rejected'}` });
      // Remove from pending list locally
      setPending((prev) => prev.filter((p) => (p.id || p.leave_request_id) !== id));
      // Refresh all requests
      fetchAllRequests();
    } catch (err) {
      setSnack({ open: true, severity: 'error', message: err?.response?.data?.message || err.message || 'Action failed' });
    } finally {
      setActionLoading(false);
      closeConfirm();
    }
  };

  const openHistory = async (teacherId) => {
    setSelectedTeacherId(teacherId);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const token = await GetToken();
      // Filter all requests for this teacher
      const filtered = allRequests.filter(r =>
        (r.teacher_id || r.teacher?.id) === teacherId
      );
      setTeacherHistory(filtered);
    } catch (err) {
      setTeacherHistory([]);
      setSnack({ open: true, severity: 'error', message: 'Failed to load teacher history' });
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryOpen(false);
    setSelectedTeacherId(null);
    setTeacherHistory([]);
  };

  const openDeleteConfirm = (id) => {
    setSelectedDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setSelectedDeleteId(null);
    setDeleteConfirmOpen(false);
  };

  const performDelete = async () => {
    if (!selectedDeleteId) return;
    setActionLoading(true);
    try {
      const token = await GetToken();
      const url = `${Backend.api}${Backend.leaveRequests}${selectedDeleteId}/`;
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      await axios.delete(url, { headers });
      setSnack({ open: true, severity: 'success', message: 'Leave request deleted successfully' });
      fetchPending();
      fetchAllRequests();
      closeDeleteConfirm();
    } catch (err) {
      setSnack({ open: true, severity: 'error', message: err?.response?.data?.message || err.message || 'Failed to delete' });
    } finally {
      setActionLoading(false);
    }
  };

  const statusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'canceled':
      case 'cancelled':
        return 'default';
      default:
        return 'warning';
    }
  };

  const renderPendingTable = () => (
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
          <Typography>No pending teacher leave requests.</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Teacher</TableCell>
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
                const teacherName = r.teacher_details?.user_details?.full_name ||
                  r.teacher?.user?.full_name ||
                  r.teacher_details?.full_name ||
                  r.teacher?.full_name ||
                  r.requested_by_details?.full_name ||
                  r.teacher_name ||
                  'Teacher';
                return (
                  <TableRow key={id}>
                    <TableCell>{dayjs(r.date).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>{teacherName}</TableCell>
                    <TableCell>
                      {r.subject ? 'Subject' : 'Full day'}
                    </TableCell>
                    <TableCell>
                      {r.subject ? (
                        <div>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {r.subject?.name || r.subject?.code || '—'}
                          </Typography>
                        </div>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell>
                      <Chip label={r.status || 'pending'} color={statusColor(r.status)} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton onClick={() => openHistory(r?.teacher_id || r.teacher?.id)} title="View teacher history">
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
                        <IconButton
                          onClick={() => openDeleteConfirm(id)}
                          title="Delete request"
                          color="error"
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
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
  );

  const renderAllRequestsTable = () => (
    <Paper>
      {allRequests.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>No teacher leave requests found.</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Subject / Period</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allRequests.map((r) => {
                const id = r.id || r.leave_request_id;
                const teacherName = r.teacher_details?.user_details?.full_name ||
                  r.teacher?.user?.full_name ||
                  r.teacher_details?.full_name ||
                  r.teacher?.full_name ||
                  r.requested_by_details?.full_name ||
                  r.teacher_name ||
                  'Teacher';
                return (
                  <TableRow key={id}>
                    <TableCell>{dayjs(r.date).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>{teacherName}</TableCell>
                    <TableCell>
                      {r.subject ? 'Subject' : 'Full day'}
                    </TableCell>
                    <TableCell>
                      {r.subject ? (
                        <div>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {r.subject?.name || r.subject?.code || '—'}
                          </Typography>
                        </div>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell>
                      <Chip label={r.status || 'pending'} color={statusColor(r.status)} />
                    </TableCell>
                    <TableCell>{dayjs(r.created_at).format('YYYY-MM-DD HH:mm')}</TableCell>
                    <TableCell align="right">
                        <IconButton
                          onClick={() => openDeleteConfirm(id)}
                          title="Delete request"
                          color="error"
                          size="small"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={() => { fetchPending(); fetchAllRequests(); }} disabled={loading}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {!showOnlyAll && !onlyPending && (
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={tab}
            onChange={handleChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Pending Requests" />
            <Tab label="All Requests" />
          </Tabs>
        </Paper>
      )}

      <Box>
        {(tab === 0 || onlyPending) && !showOnlyAll && (
          <>
            {!onlyPending && !showOnlyAll && <Typography variant="h6" sx={{ mb: 2 }}>Teacher Pending Requests</Typography>}
            {onlyPending && <Typography variant="h6" sx={{ mb: 2 }}>Teacher Pending Requests</Typography>}
            {renderPendingTable()}
          </>
        )}
        {(tab === 1 || showOnlyAll) && !onlyPending && (
          <>
            {!onlyPending && !showOnlyAll && <Typography variant="h6" sx={{ mb: 2 }}>All Teacher Requests</Typography>}
            {showOnlyAll && <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>All Teacher Requests</Typography>}
            {renderAllRequestsTable()}
          </>
        )}
      </Box>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={closeConfirm}>
        <DialogTitle>{confirmAction?.type === 'approve' ? 'Approve teacher leave request?' : 'Reject teacher leave request?'}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {confirmAction?.type === 'approve' ? 'approve' : 'reject'} this teacher leave request?
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
        <DialogTitle>Teacher Leave History</DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : teacherHistory.length === 0 ? (
            <Typography>No leave history for this teacher.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teacherHistory.map((h) => (
                    <TableRow key={h.id || h.leave_request_id || JSON.stringify(h)}>
                      <TableCell>{dayjs(h.date).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{h.reason}</TableCell>
                      <TableCell>
                        <Chip label={h.status || '—'} color={statusColor(h.status)} />
                      </TableCell>
                      <TableCell>{dayjs(h.created_at).format('YYYY-MM-DD HH:mm')}</TableCell>
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

      {/* Confirm delete dialog */}
      <Dialog open={deleteConfirmOpen} onClose={closeDeleteConfirm}>
        <DialogTitle>Delete Teacher Leave Request?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete this teacher leave request? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm}>No</Button>
          <Button variant="contained" color="error" onClick={performDelete} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={18} /> : 'Yes, delete'}
          </Button>
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

AdminTeacherLeaveRequestsPage.propTypes = {
  baseUrl: PropTypes.string,
};
