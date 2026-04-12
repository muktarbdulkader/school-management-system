import { Box, Typography } from '@mui/material';
import React from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PropTypes from 'prop-types';
import { formattedDate } from 'utils/function';

const TaskListReport = ({ title, created_at, sub_task_count }) => {
  return (
    <DrogaCard sx={{ display: 'flex', justifyContent: 'space-between', marginY: 1.2 }}>
      <Box>
        <Typography variant="subtitle1" color="text.primary">
          {title}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Created on: {formattedDate(created_at)}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle2">Subtasks</Typography>
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'gray', mx: 1 }}></Box>
        <Typography variant="subtitle1" color="text.primary">
          {sub_task_count}
        </Typography>
      </Box>
    </DrogaCard>
  );
};

TaskListReport.propTypes = {
  title: PropTypes.string,
  created_at: PropTypes.string,
  sub_task_count: PropTypes.number
};
export default TaskListReport;
