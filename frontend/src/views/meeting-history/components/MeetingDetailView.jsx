import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import EditMeeting from './EditMeeting';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast, ToastContainer } from 'react-toastify';

const MeetingDetailView = ({ meeting, fetchMeetings }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    per_page: 10,
    last_page: 0,
    total: 0,
  });

  if (!meeting) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography>Select a meeting to view details</Typography>
      </Box>
    );
  }

  const formatDateTime = (dateStr, timeStr) => {
    try {
      const dateTime = new Date(`${dateStr}T${timeStr}`);
      return {
        date: format(dateTime, 'MMM d, yyyy'),
        time: format(dateTime, 'h:mm a'),
      };
    } catch {
      return { date: 'Invalid date', time: '' };
    }
  };

  const { date, time } = formatDateTime(
    meeting.requested_date,
    meeting.requested_time,
  );

  const handleReschedule = async () => {
    try {
      setLoadingUser(true);
      await fetchUsers(); // Fetch users first
      setEditModalOpen(true); // Then open the modal
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleEditSubmit = async (updatedMeetingData) => {
    setIsUpdating(true);
    const token = await GetToken();

    const Api = `${Backend.auth}${Backend.communicationMeetings}${meeting?.id}/reschedule/`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    // Prepare the data structure expected by your API
    const data = {
      requested_to: updatedMeetingData.requested_to,
      requested_date: updatedMeetingData.requested_date,
      requested_time: updatedMeetingData.requested_time,
      notes: updatedMeetingData.notes,
    };

    try {
      const response = await fetch(Api, {
        method: 'PATCH',
        headers: header,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || 'Error updating meeting');
      }

      const responseData = await response.json();
      if (responseData.success) {
        toast.success('Meeting updated successfully');
        setIsUpdating(false);

        fetchMeetings();
        setEditModalOpen(false); // Close the modal
      } else {
        setIsUpdating(false);
        toast.error(responseData.message || 'Failed to update meeting.');
      }
    } catch (error) {
      toast.error(error.message || 'An unexpected error occurred.');
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.communicationMeetings}${meeting?.id}/cancel/`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'POST',
        headers: header,
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || 'Error cancel meeting');
      }

      const responseData = await response.json();
      if (responseData.success) {
        toast.success('Meeting cancelled successfully');
        fetchMeetings();
      } else {
        toast.error(responseData.message || 'Failed to cancel meeting.');
      }
    } catch (error) {
      toast.error(error.message || 'An unexpected error occurred.');
    }
  };

  const handleAccept = async () => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.communicationMeetings}${meeting?.id}/approve/`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'PATCH',
        headers: header,
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || 'Error approve meeting');
      }

      const responseData = await response.json();
      if (responseData.success) {
        toast.success('Meeting approved successfully');
        fetchMeetings();
      } else {
        toast.error(responseData.message || 'Failed to approve meeting.');
      }
    } catch (error) {
      toast.error(error.message || 'An unexpected error occurred.');
    }
  };

  const handleReject = async () => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.communicationMeetings}${meeting?.id}/reject/`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, {
        method: 'PATCH',
        headers: header,
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || 'Error reject meeting');
      }

      const responseData = await response.json();
      if (responseData.success) {
        toast.success('Meeting rejected successfully');
        fetchMeetings();
      } else {
        toast.error(responseData.message || 'Failed to reject meeting.');
      }
    } catch (error) {
      toast.error(error.message || 'An unexpected error occurred.');
    }
  };

  const handleComplete = async () => {
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.communicationMeetings}${meeting?.id}/mark_completed/`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const requestBody = {
      demand_fulfilled: true,
    };

    try {
      const response = await fetch(Api, {
        method: 'PATCH',
        headers: header,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || 'Error completing meeting');
      }

      const responseData = await response.json();
      if (responseData.success) {
        toast.success('Meeting completed successfully');
        fetchMeetings();
      } else {
        toast.error(responseData.message || 'Failed to complete meeting.');
      }
    } catch (error) {
      toast.error(error.message || 'An unexpected error occurred.');
    }
  };

  const fetchUsers = async () => {
    setLoadingUser(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.users}?page=${pagination.page + 1}&per_page=${pagination.per_page}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch branches');
      }

      if (responseData.success) {
        setUsers(responseData.data);
        setPagination({
          ...pagination,
          last_page: responseData.last_page || 1,
          total: responseData.total || responseData.data.length,
        });
        setError(false);
      } else {
        toast.warning(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setLoadingUser(false);
    }
  };

  // Check meeting status for conditional button rendering
  const user = useSelector((state) => state.user?.user);
  
  const isPendingMeeting = meeting.status === 'pending';
  const isApprovedOrConfirmedMeeting =
    meeting.status === 'approved' || meeting.status === 'confirmed';
    
  const isRequester = user && meeting?.requested_by_details && user.id === meeting.requested_by_details.id;
  const canApproveOrReject = isPendingMeeting && !isRequester;
  const canShowCompleteButton = isApprovedOrConfirmedMeeting && !isRequester;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={meeting.avatar_url}
            alt={meeting.requested_to_details.full_name}
            sx={{ width: 56, height: 56 }}
          />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {meeting.requested_to_details.full_name || 'Mr'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {meeting.requested_to_details.roles || 'Mathematics Teacher'}
            </Typography>
          </Box>
        </Stack>

        {meeting.status && (
          <Chip
            label={
              meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)
            }
            color={
              meeting.status === 'confirmed' ||
              meeting.status === 'approved' ||
              meeting.status === 'completed'
                ? 'success'
                : meeting.status === 'pending'
                  ? 'warning'
                  : meeting.status === 'rejected' ||
                      meeting.status === 'cancelled'
                    ? 'error'
                    : 'default'
            }
            variant="filled"
          />
        )}
      </Stack>
      <Stack direction="row" spacing={3} mb={3}>
        <Typography variant="body2">📅 {date}</Typography>
        <Typography variant="body2">⏰ {time}</Typography>
        {meeting.branch_name && (
          <Typography variant="body2">📍 {meeting.branch_name}</Typography>
        )}
      </Stack>
      <Divider />
      {/* Meeting Reason */}
      {meeting.notes && (
        <Box mt={3}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Meeting Reason
          </Typography>
          <Box
            sx={{
              backgroundColor: '#f9fafb',
              p: 2,
              borderRadius: 1,
              border: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="body2">{meeting.notes}</Typography>
          </Box>
        </Box>
      )}
      {/* Agenda */}
      {meeting.agenda && meeting.agenda.length > 0 && (
        <Box mt={3}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Meeting Agenda
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {meeting.agenda.map((item, idx) => (
              <li key={idx}>
                <Typography variant="body2">{item}</Typography>
              </li>
            ))}
          </ul>
        </Box>
      )}
      {/* Teacher Feedback */}
      {meeting.feedback && (
        <Box mt={3}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Teacher's Feedback
          </Typography>
          <Box
            sx={{
              backgroundColor: '#f9fafb',
              p: 2,
              borderRadius: 1,
              border: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="body2">{meeting.feedback}</Typography>
          </Box>
        </Box>
      )}
      {/* Buttons */}
      <Stack direction="row" spacing={2} mt={4} flexWrap="wrap" gap={1}>
        {canApproveOrReject && (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={handleAccept}
              sx={{ minWidth: 120 }}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleReject}
              sx={{ minWidth: 120 }}
            >
              Reject
            </Button>
          </>
        )}

        {canShowCompleteButton && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleComplete}
            sx={{ minWidth: 120 }}
          >
            Complete
          </Button>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleReschedule}
          disabled={loadingUser}
          sx={{ minWidth: 120 }}
        >
          {loadingUser ? <CircularProgress size={24} /> : 'Reschedule'}
        </Button>

        <Button
          variant="outlined"
          color="inherit"
          onClick={handleCancel}
          sx={{ minWidth: 120 }}
        >
          Cancel Meeting
        </Button>
      </Stack>
      <ToastContainer />

      <EditMeeting
        edit={editModalOpen}
        isUpdating={isUpdating}
        meetingData={{
          ...meeting,
          requested_to:
            meeting.requested_to_details?.id || meeting.requested_to,
        }}
        users={users}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />
    </Box>
  );
};

export default MeetingDetailView;
