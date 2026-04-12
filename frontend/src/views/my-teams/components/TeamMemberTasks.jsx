import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import Fallbacks from 'utils/components/Fallbacks';
import { TabularTask } from './TabularTask';

const TeamMemberTasks = ({
  tasks,
  changeStatus,
  addSubtask,
  onSubtaskStatusChange,
  statusIsChanging,
  onActionTaken,
  onViewDetail,
}) => {
  const handleAddingSubtask = (task) => {
    addSubtask(task);
  };

  const handleTaskAction = (action, task) => {
    onActionTaken(action, task);
  };

  const handleViewingDetail = (task) => {
    onViewDetail(task);
  };

  return (
    <React.Fragment>
      <Grid container sx={{ gap: 3, py: 1, width: '100%' }}>
        {tasks.length === 0 ? (
          <Fallbacks
            severity="weekly-task"
            title={`There is no task for this week`}
            description=""
            sx={{ paddingY: 6 }}
            size={60}
          />
        ) : (
          tasks.map((task, index) => (
            <TabularTask
              key={index}
              task={task}
              onChangeStatus={changeStatus}
              onAddSubtask={() => handleAddingSubtask(task)}
              onSubtaskStatusChange={onSubtaskStatusChange}
              statusIsChanging={statusIsChanging}
              onActionTaken={(action) => handleTaskAction(action, task)}
              onViewDetail={() => handleViewingDetail(task)}
            />
          ))
        )}
      </Grid>
    </React.Fragment>
  );
};

TeamMemberTasks.propTypes = {
  tasks: PropTypes.array.isRequired,
  changeStatus: PropTypes.func.isRequired,
  addSubtask: PropTypes.func.isRequired,
  onSubtaskStatusChange: PropTypes.func.isRequired,
  statusIsChanging: PropTypes.bool.isRequired,
  onActionTaken: PropTypes.func.isRequired,
  onViewDetail: PropTypes.func.isRequired,
};

export default TeamMemberTasks;
