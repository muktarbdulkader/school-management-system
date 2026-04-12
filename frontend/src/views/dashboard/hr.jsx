import React from 'react';

// material-ui
import Grid from '@mui/material/Grid';

// project imports
import PageContainer from 'ui-component/MainPage';
import EmployeeLeaderboard from './components/EmployeeLeaderboard';
import SummaryCount from './components/hr/SummaryCount';
import UnitLeaderboard from './components/UnitLeaderboard';
import ActivitySummary from './components/ActivitySummary';
import DashboardSelector from './dashboard-selector';

const HrDashboard = () => {
  return (
    <PageContainer title="Dashboard" rightOption={<DashboardSelector />}>
      <Grid container spacing={3} mt={1}>
        <SummaryCount />
        <EmployeeLeaderboard />
        <UnitLeaderboard />
        <ActivitySummary />
      </Grid>
    </PageContainer>
  );
};

export default HrDashboard;
