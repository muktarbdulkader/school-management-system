import React, { useState, useEffect, use } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import toast from 'react-hot-toast';

/**
 * LeaveRequestForm
 *
 * Parent-facing modal to create a leave request for the currently selected student.
 *
 * Requirements and behavior (per your spec):
 * - Student ID is read from Redux: state.student.studentId
 * - Parent/User ID is read from Redux: state.user.user.id
 * - Supports `leave_type` = 'full_day' | 'subject'
 * - If leave_type === 'subject', `subject_id` and `period_type` are required.
 * - If period_type === 'specific', `period_number` is required.
 * - POSTs to `${baseUrl}/api/leave_requests/` with the correct body.
 *
 * Props:
 * - open: boolean
 * - onClose: function
 * - onSuccess: function -> called after successful creation (optional)
 * - baseUrl: string (optional) - fallback to process.env.REACT_APP_BASE_URL
 */

export default function LeaveRequestForm({ open, onClose, onSuccess }) {
  // Get studentId and userId from redux store
  const studentId = useSelector(
    (state) => state.student?.studentData?.student_details?.id,
  );
  const studentName = useSelector(
    (state) =>
      state.student?.studentData?.student_details?.user_details?.full_name,
  );

  const userId = useSelector((state) => state.user?.user?.id);
  const userRoles = useSelector((state) => state.user?.user?.roles);
  const userStudentData = useSelector((state) => state.user?.user?.student);
  
  // Check if current user is a student
  const normalizedRoles = userRoles?.map((role) => 
    typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()
  ) || [];
  const isStudent = normalizedRoles.includes('student');
  
  // For students, use their own student ID
  const effectiveStudentId = isStudent ? userStudentData?.id : studentId;
  const effectiveStudentName = isStudent ? userStudentData?.user?.full_name : studentName;

  // Local form state
  const [leaveType, setLeaveType] = useState('full_day');
  const [subjectId, setSubjectId] = useState('');
  const [periodType, setPeriodType] = useState('all');
  const [periodNumber, setPeriodNumber] = useState('');
  const [date, setDate] = useState(null);
  const [reason, setReason] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  function resetForm() {
    setLeaveType('full_day');
    setSubjectId('');
    setPeriodType('all');
    setPeriodNumber('');
    setDate(null);
    setReason('');
    setError('');
    setLoading(false);
  }

  const validate = () => {
    if (!effectiveStudentId) {
      if (isStudent) {
        return 'Unable to resolve your student profile. Please contact support.';
      }
      return 'No student selected. Please select a student from the sidebar.';
    }
    if (!userId) {
      return 'Unable to resolve your user ID. Please sign in again.';
    }
    if (!date) {
      return 'Please pick a date for the leave.';
    }
    if (!reason || reason.trim().length < 3) {
      return 'Please provide a short reason (at least 3 characters).';
    }
    if (leaveType === 'subject') {
      if (!subjectId) return 'Please select a subject for subject-level leave.';
      if (!periodType) return 'Please select a period type (all / specific).';
      if (
        periodType === 'specific' &&
        (!periodNumber || Number.isNaN(Number(periodNumber)))
      ) {
        return 'Please provide a valid period number for the specific period.';
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!effectiveStudentId) return;
      
      try {
        const token = await GetToken();
        const url = `${Backend.api}student_subjects/`;
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        const res = await axios.get(url, { headers: headers });
        const data = Array.isArray(res.data.data)
          ? res.data.data
          : res.data?.results || [];
        
        // Filter subjects for the effective student
        const filtered = isStudent 
          ? data.filter((s) => s.student_id === effectiveStudentId || s.student === effectiveStudentId)
          : data.filter((s) => s.student === effectiveStudentName);
        
        setSubjects(filtered);
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };
    
    if (open) {
      fetchSubjects();
    }
  }, [effectiveStudentId, effectiveStudentName, isStudent, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      student_id: effectiveStudentId,
      requested_by: userId,
      leave_type: leaveType === 'full_day' ? 'full_day' : 'subject',
      date: dayjs(date).format('YYYY-MM-DD'),
      reason: reason.trim(),
    };

    if (leaveType === 'subject') {
      payload.subject_id = subjectId;
      payload.period_type = periodType; // 'all' or 'specific'
      if (periodType === 'specific')
        payload.period_number = Number(periodNumber);
    }

    setLoading(true);
    try {
      const token = await GetToken();
      const header = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const url = `${Backend.api}${Backend.leaveRequests}`;
      const res = await axios.post(url, payload, { headers: header });
      setLoading(false);
      setSuccessOpen(true);
      toast.success('Leave request created successfully');
      if (onSuccess) onSuccess(res.data);
      setTimeout(() => {
        setSuccessOpen(false);
        onClose();
      }, 800);
    } catch (err) {
      setLoading(false);
      const message =
        err?.response?.data?.detail ||
        err?.response?.data ||
        err.message ||
        'Failed to create leave request';
      setError(typeof message === 'string' ? message : JSON.stringify(message));
      toast.error('Failed to create leave request');
    }
  };
  console.log('Rendering LeaveRequestForm with state:', subjects);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Create Leave Request</DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Stack spacing={2}>
              {/* Leave Type */}
              <FormControl fullWidth>
                <InputLabel id="leave-type-label">Leave Type</InputLabel>
                <Select
                  labelId="leave-type-label"
                  value={leaveType}
                  label="Leave Type"
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <MenuItem value="full_day">Full day</MenuItem>
                  <MenuItem value="subject">Subject / Period</MenuItem>
                </Select>
              </FormControl>

              {/* Subject (only when subject leave) - NOTE: you should replace the hardcoded subjects with real data when available */}
              {leaveType === 'subject' && (
                <>
                  <FormControl fullWidth>
                    <InputLabel id="subject-label">Subject</InputLabel>
                    <Select
                      labelId="subject-label"
                      value={subjectId}
                      label="Subject"
                      onChange={(e) => setSubjectId(e.target.value)}
                    >
                      {subjects.map((subject) => (
                        <MenuItem key={subject?.subject?.id} value={subject?.subject?.id}>
                          {subject?.subject?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel id="period-type-label">Period Type</InputLabel>
                    <Select
                      labelId="period-type-label"
                      value={periodType}
                      label="Period Type"
                      onChange={(e) => setPeriodType(e.target.value)}
                    >
                      <MenuItem value="all">All periods</MenuItem>
                      <MenuItem value="specific">Specific period</MenuItem>
                    </Select>
                  </FormControl>

                  {periodType === 'specific' && (
                    <TextField
                      label="Period Number"
                      type="number"
                      fullWidth
                      value={periodNumber}
                      onChange={(e) => setPeriodNumber(e.target.value)}
                      inputProps={{ min: 1 }}
                    />
                  )}
                </>
              )}

              {/* Date */}
              <DatePicker
                label="Date"
                value={date}
                onChange={(newVal) => setDate(newVal)}
                slotProps={{ textField: { fullWidth: true } }}
              />

              {/* Reason */}
              <TextField
                label="Reason"
                minRows={3}
                multiline
                fullWidth
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Short explanation for the leave"
              />

              {/* Error if any */}
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" type="submit" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Send Request'}
            </Button>
          </DialogActions>
        </form>

        <Snackbar
          open={successOpen}
          autoHideDuration={2000}
          onClose={() => setSuccessOpen(false)}
        >
          <Alert severity="success" sx={{ width: '100%' }}>
            Leave request created successfully
          </Alert>
        </Snackbar>
      </Dialog>
    </LocalizationProvider>
  );
}

LeaveRequestForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
