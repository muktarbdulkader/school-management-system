import {
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const PastMeeting = ({ onMessageSelect, selectedMessageId }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const fetchMeetings = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = `${Backend.auth}${Backend.communicationMeetings}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(Api, { method: 'GET', headers: header });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch meetings');
      }

      if (responseData.success) {
        setMeetings(responseData.data);
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
      setLoading(false);
    }
  };

  const user = useSelector((state) => state.user?.user);
  
  const pendingMeetings = meetings.filter((meeting) => {
    const isRelated = user && (meeting.requested_by_details?.id === user.id || meeting.requested_to_details?.id === user.id);
    return meeting.status?.toLowerCase() === 'completed' && isRelated;
  });

  useEffect(() => {}, [meetings]);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  const formatTime = (timeStr) => {
    try {
      const time = new Date(`1970-01-01T${timeStr}`);
      return format(time, 'h:mm a');
    } catch (e) {
      console.error('Error formatting time:', e);
      return 'Invalid time';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Box p={4}>
        <Typography color="error">Error loading meetings</Typography>
      </Box>
    );
  if (!pendingMeetings.length)
    return (
      <Box p={4}>
        <Typography>No meetings scheduled</Typography>
      </Box>
    );

  return (
    <Box sx={{ p: 2, maxWidth: '100%', mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {pendingMeetings.map((meeting) => (
          <Card
            key={meeting.id}
            sx={{
              borderTop: '1px solid',
              borderBottom: '1px solid',
              borderColor: 'divider',
              borderRadius: 0,
              cursor: 'pointer',
              backgroundColor:
                selectedMessageId === meeting.id
                  ? 'action.selected'
                  : 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            onClick={() => onMessageSelect(meeting)}
          >
            <CardContent sx={{ p: '16px !important' }}>
              <ListItem sx={{ p: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {meeting.requested_by_full_name?.charAt(0) || 'A'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mr: 1 }}
                      >
                        Meeting with {meeting.requested_to_details.full_name}
                      </Typography>
                      <Chip
                        label={meeting.status}
                        color={getStatusColor(meeting.status)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      {meeting.notes && (
                        <Typography
                          variant="body1"
                          sx={{
                            mt: 1,
                            whiteSpace: 'pre-line',
                            wordBreak: 'break-word',
                            fontStyle: 'italic',
                          }}
                        >
                          Notes: {meeting.notes}
                        </Typography>
                      )}

                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarMonthIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatDate(meeting.requested_date)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <AccessTimeIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatTime(meeting.requested_time)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

PastMeeting.propTypes = {
  fetchMessages: PropTypes.func.isRequired,
  onMessageSelect: PropTypes.func.isRequired,
  selectedMessageId: PropTypes.string,
};

export default PastMeeting;
