import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid } from '@mui/material';
import { useDashboards } from 'context/DashboardContext';
import Fallbacks from 'utils/components/Fallbacks';
import ParentDashboard from './parent-dashboard';
import TeacherDashboardPage from './teacher-dashboard';
import SMSAdminDashboard from './sms-admin-dashboard';
import StudentDashboard from './student-dashboard';
import LibrarianDashboard from './librarian-dashboard';

const Dashboard = () => {
  const { activeDashboard, handleChangingDashboard } = useDashboards();
  const user = useSelector((state) => state.user.user);
  

  useEffect(() => {
    if (!user?.roles || user.roles.length === 0) {
      // Default to student dashboard if no roles assigned
      handleChangingDashboard('student');
      return;
    }

    const normalizedRoles = user.roles.map((role) => 
      typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()
    );

    // Priority order: Admin > Teacher > Parent > Student
    if (normalizedRoles.includes('admin') || 
        normalizedRoles.includes('staff') ||
        normalizedRoles.includes('hr') ||
        normalizedRoles.includes('counselor') ||
        normalizedRoles.includes('clinic') ||
        normalizedRoles.includes('tlh') ||
        normalizedRoles.includes('analyst') ||
        normalizedRoles.includes('finance') ||
        normalizedRoles.includes('communication') ||
        normalizedRoles.includes('head admin') ||
        normalizedRoles.includes('head_admin') ||
        normalizedRoles.includes('ceo') ||
        normalizedRoles.includes('super_admin')) {
      handleChangingDashboard('admin');
    } else if (normalizedRoles.includes('librarian')) {
      handleChangingDashboard('librarian');
    } else if (normalizedRoles.includes('teacher')) {
      handleChangingDashboard('teacher');
    } else if (normalizedRoles.includes('parent')) {
      handleChangingDashboard('parent');
    } else if (normalizedRoles.includes('student')) {
      handleChangingDashboard('student');
    } else {
      // Default fallback
      handleChangingDashboard('student');
    }
  }, [user, handleChangingDashboard]);

  console.log('Active Dashboard:', activeDashboard);
  console.log('User Roles:', user?.roles);

  if (activeDashboard === 'parent') {
    return <ParentDashboard />;
  } else if (activeDashboard === 'teacher') {
    return <TeacherDashboardPage />;
  } else if (activeDashboard === 'admin') {
    return <SMSAdminDashboard />;
  } else if (activeDashboard === 'student') {
    return <StudentDashboard />;
  } else if (activeDashboard === 'librarian') {
    return <LibrarianDashboard />;
  } else {
    return (
      <Grid container>
        <Grid
          item
          xs={12}
          sx={{
            height: '90dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Fallbacks
            severity="dashboard"
            title="Loading Dashboard"
            description="Please wait while we load your dashboard..."
          />
        </Grid>
      </Grid>
    );
  }
};

export default Dashboard;
