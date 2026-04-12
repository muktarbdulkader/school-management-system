import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { KanBanColumn } from './components/KanBanColumn';
import { EmployeeTasks } from './components/EmployeeTasks';
import KanbanColumns from 'data/todo/kanbanColumns';
import Fallbacks from 'utils/components/Fallbacks';

const BoardView = ({
  tasks,
  changeStatus,
  createTask,
  addSubtask,
  onSubtaskStatusChange,
  statusIsChanging,
  onActionTaken,
  onViewDetail
}) => {
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
      <Box
        sx={{
          width: '100%',
          height: '100dvh',
          display: 'flex',
          alignItems: 'flex-start',
          overflowX: 'auto',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          gap: 3,
          py: 2,
          pb: { xs: 11, sm: 11, md: 0 },
          scrollbarWidth: 'none',
          '-ms-overflow-style': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }}
      >
        {KanbanColumns.filter((column) => column.name !== 'all').map((column, index) => {
          const columnTasks = [];
          if (tasks.length > 0) {
            tasks.filter((item) => item.status === column.name && columnTasks.push(item));
          }
          return (
            <KanBanColumn key={index} column={column} no_of_tasks={columnTasks.length} onAddTask={createTask}>
              {columnTasks.length === 0 ? (
                <Fallbacks severity="daily-tasks" title={`No ${column.name} task`} description="" sx={{ paddingY: 6 }} size={60} />
              ) : (
                columnTasks.map((task, index) => (
                  <EmployeeTasks
                    key={index}
                    task={task}
                    color={column?.primary_color}
                    onChangeStatus={changeStatus}
                    onAddSubtask={(subtask) => handleAddingSubtask(subtask, task)}
                    onSubtaskStatusChange={onSubtaskStatusChange}
                    statusIsChanging={statusIsChanging}
                    onActionTaken={(action) => handleTaskAction(action, task)}
                    onViewDetail={() => handleViewingDetail(task)}
                  />
                ))
              )}
            </KanBanColumn>
          );
        })}
      </Box>
    </React.Fragment>
  );
};
BoardView.propTypes = {
  tasks: PropTypes.array.isRequired,
  changeStatus: PropTypes.func.isRequired,
  createTask: PropTypes.func.isRequired,
  addSubtask: PropTypes.func.isRequired,
  onSubtaskStatusChange: PropTypes.func.isRequired,
  statusIsChanging: PropTypes.bool.isRequired,
  onActionTaken: PropTypes.func.isRequired,
  onViewDetail: PropTypes.func.isRequired,
};

export default BoardView;

