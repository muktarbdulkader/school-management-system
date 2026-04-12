import React from 'react';
import PerformanceReport from '../components/PerformanceReport';
import WeeklyTaskReport from '../components/WeeklyTaskReport';
import LeaderBoard from '../components/LeaderBoard';
import MonthlyTrends from 'views/performance/components/MonthlyTrends';
import Backend from 'services/backend';
import { Grid } from '@mui/material';
import { gridSpacing } from 'store/constant';

const EmployeeReport = () => {
  return (
    <>
      <WeeklyTaskReport />
      <Grid container spacing={gridSpacing} my={2}>
        <Grid item xs={12}>
          <MonthlyTrends title="Monthly Trends" url={Backend.api + Backend.myMonthlyTrends} itshows="Performance" />
        </Grid>
      </Grid>
      <PerformanceReport />
      <LeaderBoard />
    </>
  );
};

export default EmployeeReport;
