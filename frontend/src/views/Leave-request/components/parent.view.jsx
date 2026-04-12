import React from 'react';
import PropTypes from 'prop-types';
import { Box, Tabs, Tab, Paper, Stack, Typography } from '@mui/material';
import LeaveRequestList from './LeaveRequestList';
import LeaveRequestArchived from './LeaveRequestArchived';
import { useSelector } from 'react-redux';

/**
 * ParentLeaveRequestsPage
 *
 * Simple page wrapper with tabs to switch between "My Requests" and "Archived" for the selected student.
 *
 * Props:
 * - baseUrl: optional API base URL
 */
export default function ParentLeaveRequestsPage() {
  const [tab, setTab] = React.useState(0);
  const user = useSelector((state) => state.user.user);
  const handleChange = (e, newVal) => setTab(newVal);

  return (
    <>
      {user.roles.includes('Parent') ? (
        <Box
          sx={{ p: 3, width: '100%', mx: 'auto', mt: 4 }}
          data-testid="ParentLeaveRequestsPage">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2, p: 5 }}
          >
            <Box>{/* reserved for global actions if needed */}</Box>
          </Stack>

          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={tab}
              onChange={handleChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="My Requests" />
              <Tab label="Archived" />
            </Tabs>
          </Paper>

          <Box>
            {tab === 0 && <LeaveRequestList />}
            {tab === 1 && <LeaveRequestArchived />}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{ p: 3, width: '100%', mx: 'auto', mt: 4 }}
          data-testid="NoPermission"
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2, p: 5 }}
          >
            <Typography variant="h5">Leave Requests</Typography>
            <Box>{/* reserved for global actions if needed */}</Box>
          </Stack>
          <Typography variant="h6">
            You do not have permission to view this page.
          </Typography>
        </Box>
      )}
    </>
  );
}

ParentLeaveRequestsPage.propTypes = {
  baseUrl: PropTypes.string,
};
