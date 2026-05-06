import React from 'react';
import { Box, Typography, Tabs, Tab, Paper, Stack } from '@mui/material';
import PageContainer from 'ui-component/MainPage';
import LeaveRequestList from './components/LeaveRequestList';
import LeaveRequestArchived from './components/LeaveRequestArchived';
import TeacherLeaveRequestsPage from './components/teacher.view';
import AdminTeacherLeaveRequestsPage from './components/admin-teacher.view';
import { useSelector } from 'react-redux';

/**
 * LeaveRequestsPage
 *
 * Page with tabs to switch between "My Requests" and "Archived"
 * Supports both student and teacher leave requests
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
  const isSuperAdmin = normalizedRoles.includes('super_admin') || normalizedRoles.includes('superadmin') || user?.is_superuser;
  const hasAccess = isTeacher || isParent || isStudent || isSuperAdmin;

  const handleChange = (e, newVal) => {
    console.log('Tab changed:', { from: tab, to: newVal, isTeacher, isSuperAdmin });
    alert(`Tab clicked: ${newVal}`);
    setTab(newVal);
  };

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
      ) : isSuperAdmin ? (
        <AdminTeacherLeaveRequestsPage />
      ) : isTeacher ? (
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
              {isTeacher ? (
                // Teacher tabs
                <>
                  <Tab label="My Requests" onClick={() => { console.log('Tab 0 clicked'); setTab(0); }} />
                  <Tab label="Student Approvals" onClick={() => { console.log('Tab 1 clicked'); setTab(1); }} />
                  <Tab label="Archived" onClick={() => { console.log('Tab 2 clicked'); setTab(2); }} />
                </>
              ) : isSuperAdmin ? (
                // Super Admin tabs
                <>
                  <Tab label="Teacher Leave Requests" />
                  <Tab label="Student Requests" />
                  <Tab label="Archived" />
                </>
              ) : (
                // Student/Parent tabs
                <>
                  <Tab label="My Requests" />
                  <Tab label="Archived" />
                </>
              )}
            </Tabs>
          </Paper>

          <Box>
            {isTeacher ? (
              // Teacher content
              <>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                  DEBUG: tab={tab}, isTeacher={isTeacher ? 'Yes' : 'No'}
                </Typography>
                {tab === 0 && <LeaveRequestList key="my-list" requestType="teacher" />}
                {tab === 1 && <LeaveRequestList key="approval-list" requestType="student" showPendingApprovals />}
                {tab === 2 && <LeaveRequestArchived />}
              </>
            ) : isSuperAdmin ? (
              // Super Admin content
              <>
                {tab === 0 && <LeaveRequestList key="teacher-list" requestType="teacher" />}
                {tab === 1 && <LeaveRequestList key="student-list" requestType="student" />}
                {tab === 2 && <LeaveRequestArchived />}
              </>
            ) : (
              // Student/Parent content
              <>
                {tab === 0 && <LeaveRequestList key="my-list" requestType="student" />}
                {tab === 1 && <LeaveRequestArchived />}
              </>
            )}
          </Box>
        </Box>
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
