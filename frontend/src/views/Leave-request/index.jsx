import React from 'react';
import { Box, Typography, Tabs, Tab, Paper, Stack } from '@mui/material';
import PageContainer from 'ui-component/MainPage';
import LeaveRequestList from './components/LeaveRequestList';
import LeaveRequestArchived from './components/LeaveRequestArchived';
import TeacherLeaveRequestsPage from './components/teacher.view';
import { useSelector } from 'react-redux';

/**
 * LeaveRequestsPage
 *
 * Page with tabs to switch between "My Requests" and "Archived"
 */
export default function LeaveRequestsPage() {
  const [tab, setTab] = React.useState(0);
  const user = useSelector((state) => state.user.user);

  // Normalize roles to handle both string and object formats
  const normalizedRoles = user?.roles?.map((role) => 
    typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()
  ) || [];

  const isTeacher = normalizedRoles.includes('teacher');
  const isParent = normalizedRoles.includes('parent');
  const isStudent = normalizedRoles.includes('student');
  const hasAccess = isTeacher || isParent || isStudent;

  const handleChange = (e, newVal) => setTab(newVal);

  return (
    <PageContainer className="w-full" title="Leave Requests">
      {!hasAccess ? (
        <Box
          sx={{ p: 3, width: '100%', mx: 'auto', mt: 4 }}
          data-testid="NoPermission"
        >
          <Typography variant="h4" gutterBottom>
            You do not have permission to view this page.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Please contact your administrator if you believe this is an error.
          </Typography>
        </Box>
      ) : isTeacher ? (
        <TeacherLeaveRequestsPage />
      ) : (
        <Box sx={{ p: 3, width: '100%', mx: 'auto', mt: 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h3">Leave Requests</Typography>
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
      )}
    </PageContainer>
  );
}
