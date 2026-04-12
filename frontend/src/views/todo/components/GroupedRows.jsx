import React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';

export const GroupedRows = ({ column, no_of_tasks, children, onAddTask }) => {
  const theme = useTheme();
  return (
    <Grid container>
      <Grid item xs={12} sx={{ marginY: 1.4 }}>
        {children}
      </Grid>
    </Grid>
  );
};
