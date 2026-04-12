import React from 'react';
import { Grid } from '@mui/material';
import UnitEngagement from './UnitEngagement';
import ActivityTimeline from './ActivityTimeline';
import { gridSpacing } from 'store/constant';

const ActivitySummary = () => {
  return (
    <Grid item xs={12}>
      <Grid container spacing={gridSpacing} sx={{ display: 'flex', alignItems: 'flex-start', pl: 1 }}>
        <UnitEngagement />
        <ActivityTimeline />
      </Grid>
    </Grid>
  );
};

export default ActivitySummary;
