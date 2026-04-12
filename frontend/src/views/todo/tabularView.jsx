import React, { useState } from 'react';
import Fallbacks from 'utils/components/Fallbacks';
import { Chip, Grid, useTheme } from '@mui/material';
import { TabularTask } from './components/TabularTask';
import { IconCircleCheckFilled } from '@tabler/icons-react';
import KanbanColumns from 'data/todo/kanbanColumns';

const TabularView = ({ tasks, changeStatus, addSubtask, onSubtaskStatusChange, statusIsChanging, onActionTaken, onViewDetail }) => {
  const theme = useTheme();

  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const handleChangingStatusTab = (index, status) => {
    setSelectedStatusIndex(index);
    setSelectedStatus(status);
  };

  const handleAddingSubtask = (subtask, task) => {
    addSubtask(subtask, task);
  };

  const handleTaskAction = (action, task) => {
    onActionTaken(action, task);
  };

  const handleViewingDetail = (task) => {
    onViewDetail(task);
  };

  return (
    <React.Fragment>
      <Grid
        container
        sx={{
          gap: 3,
          py: 3,
          width: '100%'
        }}
      >
        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', px: 1 }}>
          {KanbanColumns.map((column, index) => (
            <Chip
              key={index}
              label={column?.name}
              value={column?.name}
              variant="text"
              onClick={() => handleChangingStatusTab(index, column?.name)}
              deleteIcon={<IconCircleCheckFilled size="1.4rem" stroke="1.8" />}
              sx={{
                backgroundColor: selectedStatusIndex === index ? column?.primary_color : 'white',
                color: selectedStatusIndex === index ? theme.palette.common.white : column?.primary_color,
                border: 0.4,
                borderRadius: 4,
                textTransform: 'capitalize',
                fontWeight: 'medium',
                px: 1,
                mx: 0.4,
                cursor: 'pointer',
                ':hover': { transform: 'scale(1.05)', color: theme.palette.common.white, backgroundColor: column?.primary_color },
                transition: 'all 0.2s ease-out'
              }}
            />
          ))}
        </Grid>

        {selectedStatusIndex && tasks.filter((task) => task?.status === selectedStatus).length === 0 ? (
          <Fallbacks
            severity="weekly-task"
            title={`No ${KanbanColumns[selectedStatusIndex].name} task`}
            description=""
            sx={{ paddingY: 6 }}
            size={60}
          />
        ) : selectedStatusIndex == 0 ? (
          tasks?.map((task, index) => (
            <TabularTask
              key={index}
              task={task}
              color={KanbanColumns.find((column) => column.name === task.status).primary_color}
              onChangeStatus={changeStatus}
              onAddSubtask={(subtask) => handleAddingSubtask(subtask, task)}
              onSubtaskStatusChange={onSubtaskStatusChange}
              statusIsChanging={statusIsChanging}
              onActionTaken={(action) => handleTaskAction(action, task)}
              onViewDetail={() => handleViewingDetail(task)}
            />
          ))
        ) : selectedStatusIndex > 0 ? (
          tasks?.map(
            (task, index) =>
              task?.status === selectedStatus && (
                <TabularTask
                  key={index}
                  task={task}
                  color={KanbanColumns[selectedStatusIndex]?.primary_color}
                  onChangeStatus={changeStatus}
                  onAddSubtask={(subtask) => handleAddingSubtask(subtask, task)}
                  onSubtaskStatusChange={onSubtaskStatusChange}
                  statusIsChanging={statusIsChanging}
                  onActionTaken={(action) => handleTaskAction(action, task)}
                  onViewDetail={() => handleViewingDetail(task)}
                />
              )
          )
        ) : null}
      </Grid>
    </React.Fragment>
  );
};

export default TabularView;
