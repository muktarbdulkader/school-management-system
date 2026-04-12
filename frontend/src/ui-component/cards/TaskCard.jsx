import React from 'react';
import { Box, Chip, Grid, Typography, useTheme } from '@mui/material';
import { getStatusColor } from 'utils/function';
import { IconChecklist } from '@tabler/icons-react';
import DrogaCard from './DrogaCard';
import PropTypes from 'prop-types';

export const TaskCard = ({ name, kpi_name, due_date, status, sub_task_count }) => {
  const theme = useTheme();
  return (
    <DrogaCard sx={{ my: 1, ':hover': { backgroundColor: theme.palette.grey[50] } }}>
      <Grid container>
        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" color={theme.palette.text.primary}>
              {name}
            </Typography>
            <Typography variant="subtitle2" color={theme.palette.text.secondary}>
              KPI: {kpi_name}
            </Typography>
          </Box>

          <Chip
            label={status}
            sx={{ color: getStatusColor(status), textTransform: 'capitalize', backgroundColor: theme.palette.grey[50] }}
          />
        </Grid>

        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconChecklist size="1rem" stroke="1.6" />
            <Typography variant="body1" ml={1}>
              {sub_task_count > 1 ? 'Sub-tasks:' : 'Sub-task:'} {sub_task_count}
            </Typography>
          </Box>

          <Typography variant="subtitle2">Due date: {due_date}</Typography>
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

TaskCard.propTypes = {
  name: PropTypes.string,
  kpi_name: PropTypes.string,
  due_date: PropTypes.string,
  status: PropTypes.string,
  sub_task_count: PropTypes.number
};
