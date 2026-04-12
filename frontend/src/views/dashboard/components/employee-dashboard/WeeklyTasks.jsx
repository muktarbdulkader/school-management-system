import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatDate } from 'utils/function';
import { TaskCard } from 'ui-component/cards/TaskCard';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import PropTypes from 'prop-types';

export const WeeklyTasks = ({ isLoading, error, tasks }) => {
  return (
    <DrogaCard>
      <Typography variant="h4">Tasks of a week</Typography>

      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8
          }}
        >
          <ActivityIndicator size={20} />
        </Box>
      ) : error ? (
        <ErrorPrompt title="Server Error" message="There is error with fetching tasks" size={140} />
      ) : tasks.length === 0 ? (
        <Fallbacks severity="tasks" title="" description="Tasks are not found" sx={{ paddingTop: 6 }} />
      ) : (
        <Box>
          {tasks.map((task, index) => (
            <TaskCard
              key={index}
              taskID={task.id}
              name={task?.title}
              kpi_name={task.kpi_name}
              due_date={formatDate(task?.date).formattedDate}
              sub_task_count={task?.sub_tasks}
              status={task?.status}
            />
          ))}
        </Box>
      )}
    </DrogaCard>
  );
};

WeeklyTasks.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.bool,
  tasks: PropTypes.array
};
