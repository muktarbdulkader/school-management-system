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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Chip,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';

/**
 * LeaveRequestArchived
 *
 * Parent-facing view that shows archived leave requests (cancelled + rejected) for the selected student.
 * Uses GET /api/leave_requests/archived/
 * Optionally allows deleting an archived request via DELETE /api/leave_requests/{id}
 *
 * Props:
 * - baseUrl: string (optional) - API base URL
 */
export default function LeaveRequestArchived() {
  const studentId = useSelector(
    (state) => state.student?.studentData?.student_details?.id,
  );
  const API_BASE = Backend.api;

  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);

  const [snack, setSnack] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  useEffect(() => {
    fetchArchived();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const fetchArchived = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await GetToken();
      const url = `${API_BASE}leave_requests/archived/`;
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const res = await axios.get(url, { headers: headers });
      const data = Array.isArray(res.data.data)
        ? res.data.data
        : res.data?.results || [];
      const filtered = data.filter(
        (r) =>
          r.student_details?.id === studentId &&
          ((r?.status || '').toLowerCase() === 'canceled' ||
            (r.status || '').toLowerCase() === 'rejected' ||
            (r.request_status || '').toLowerCase() === 'canceled' ||
            (r.request_status || '').toLowerCase() === 'rejected'),
      );
      console.log(
        'Fetched archived leave requests:',
        data,
        filtered,
        studentId,
      );
      setArchived(filtered);
    } catch (err) {
      setError(
        err?.response?.data ||
          err.message ||
          'Failed to load archived leave requests',
      );
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (id) => {
    setSelectedDeleteId(id);
    setConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setSelectedDeleteId(null);
    setConfirmOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedDeleteId) return;
    try {
      const url = `${API_BASE.replace(/\/$/, '')}/api/leave_requests/${selectedDeleteId}`;
      await axios.delete(url);
      setSnack({
        open: true,
        severity: 'success',
        message: 'Archived request deleted',
      });
      closeDeleteConfirm();
      fetchArchived();
    } catch (err) {
      setSnack({
        open: true,
        severity: 'error',
        message: err?.response?.data || err.message || 'Failed to delete',
      });
      closeDeleteConfirm();
    }
  };

  const statusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'canceled':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Archived Leave Requests</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchArchived}
            disabled={loading}
          >
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
            <Button onClick={fetchArchived} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Box>
        ) : archived.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>
              No archived leave requests for the selected student.
            </Typography>
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
                {archived.map((r) => (
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
                        label={r.status || r.request_status || 'archived'}
                        color={statusColor(r.status || r.request_status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          onClick={() =>
                            openDeleteConfirm(r.id || r.leave_request_id)
                          }
                          title="Delete archived request"
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={closeDeleteConfirm}>
        <DialogTitle>Delete archived leave request?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this archived leave
            request? This action cannot be undone.
          </Typography>
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
