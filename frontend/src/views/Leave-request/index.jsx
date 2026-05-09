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
    setTab(newVal);
  };

  // Helper to get tab index for Super Admin
  const getAdminTabIndex = (idx) => {
    return idx;
  };

  // Helper to get tab index for others
  const getOtherTabIndex = (idx) => {
    return idx;
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
      ) : (
        <Box sx={{ p: 2, width: '100%', mx: 'auto' }}>


          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 2, boxShadow: 1 }}>
            <Tabs
              value={tab}
              onChange={handleChange}
              indicatorColor="primary"
              textColor="primary"
            >
              {isSuperAdmin && <Tab label="Pending Requests" />}
              {isSuperAdmin && <Tab label="All Requests" />}
              
              {!isSuperAdmin && isTeacher && <Tab label="Pending Requests" />}
              {!isSuperAdmin && isTeacher && <Tab label="All Requests" />}
              {!isSuperAdmin && isTeacher && <Tab label="My Requests" />}
              
              {!isSuperAdmin && !isTeacher && <Tab label="My Requests" />}
              {!isSuperAdmin && !isTeacher && <Tab label="Archived" />}
            </Tabs>
          </Box>

          <Box>
            {isSuperAdmin ? (
              // Super Admin content - Unified view (No "My Requests")
              <>
                {tab === 0 && (
                  <Stack spacing={4}>
                    <AdminTeacherLeaveRequestsPage onlyPending />
                    <LeaveRequestList key="pending-students" requestType="student" showPendingApprovals />
                  </Stack>
                )}
                {tab === 1 && (
                  <Stack spacing={1}>
                     <AdminTeacherLeaveRequestsPage showOnlyAll />
                     <LeaveRequestArchived title="All Historical Requests" />
                  </Stack>
                )}
              </>
            ) : isTeacher ? (
              // Teacher content - Unified view (Includes "My Requests")
              <>
                {tab === 0 && (
                   <LeaveRequestList key="pending-students-teacher" requestType="student" showPendingApprovals />
                )}
                {tab === 1 && (
                   <LeaveRequestArchived title="Previous Student Requests" />
                )}
                {tab === 2 && (
                   <LeaveRequestList key="my-list-teacher" requestType="teacher" />
                )}
              </>
            ) : (
              // Student/Parent content
              <>
                {tab === 0 && <LeaveRequestList key="my-list-student" requestType="student" />}
                {tab === 1 && <LeaveRequestArchived />}
              </>
            )}
          </Box>
        </Box>
      )}
    </PageContainer>
  );
}
