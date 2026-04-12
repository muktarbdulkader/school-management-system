import React, { useState, useEffect, useCallback } from 'react';
import PageContainer from 'ui-component/MainPage';
import Button from '@mui/material/Button';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';
import { CircularProgress, Box, Typography } from '@mui/material';
import MeetingSideNav from './components/MeetingSideNav';
import RequestMeetingModal from './components/RequestMeetingModal';

const MeetingHistory = () => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const token = await GetToken();
      const response = await fetch(
        `${Backend.auth}${Backend.communicationMeetings}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch meetings');
      }

      if (data.success) {
        setMeetings(data.data);
      } else {
        throw new Error(data.message || 'No meetings found');
      }
    } catch (err) {
      setError(true);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  if (loading) {
    return (
      <PageContainer title="Meeting History">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Meeting History">
        <Box textAlign="center" p={4}>
          <Typography color="error" gutterBottom>
            Failed to load meetings
          </Typography>
          <Button variant="contained" onClick={fetchMeetings}>
            Retry
          </Button>
        </Box>
      </PageContainer>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', padding: 1 }}>
        <Typography sx={{ fontWeight: '600', fontSize: '23px', padding: 1 }}>
          Meeting History
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setIsRequestModalOpen(true)}
          sx={{
            ml: 'auto',
            textTransform: 'none',
            borderRadius: '6px',
          }}
        >
          Request Meeting
        </Button>
      </Box>
      <MeetingSideNav meetings={meetings} fetchMeetings={fetchMeetings} />
      <RequestMeetingModal
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={fetchMeetings}
      />
    </Box>
  );
};

export default MeetingHistory;
