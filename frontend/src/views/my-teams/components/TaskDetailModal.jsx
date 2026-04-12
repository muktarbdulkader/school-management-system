import { useState } from 'react';
import DrogaModal from 'ui-component/modal/DrogaModal';
import PropTypes from 'prop-types';
import { Subtask } from './Subtask';
import { TaskRemarks } from 'views/todo/components/task-detail/Remarks';
import { TaskOverview } from 'views/todo/components/task-detail/TaskOverview';
import TaskDetailTabs from 'views/todo/components/TaskDetailTabs';
import { Box, Collapse, IconButton, Typography, useTheme } from '@mui/material';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import Fallbacks from 'utils/components/Fallbacks';

const TaskDetailModal = ({
  open,
  task,
  title,
  handleClose,
  onCancel,
  onSubmit,
  submitting,
  statusIsChanging,
}) => {
  const theme = useTheme();
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSubtask, setSelectedSubTask] = useState(null);

  const handleDayExpanding = (day) => {
    if (selectedDay === day) {
      setSelectedDay('');
    } else {
      setSelectedDay(day);
    }
  };

  const onSubtaskStatusChange = () => {
    // Define the logic for changing the subtask status here
  };

  const handleSelectedSubtask = (subtask, newStatus, subtaskID) => {
    setSelectedSubTask(subtaskID);
    onSubtaskStatusChange(subtask, newStatus);
  };

  return (
    <DrogaModal
      open={open}
      title={title}
      handleClose={handleClose}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitting={submitting}
      containerStyle={{ display: 'flex', justifyContent: 'center' }}
      sx={{
        width: { xs: '100%', sm: '100%', md: 600 },
        minHeight: { xs: '90%', sm: '90%', md: 500 },
        p: 0,
      }}
      hideActionButtons={true}
    >
      <TaskDetailTabs
        overview={<TaskOverview task={task} />}
        subtasks={
          <Box sx={{ margin: 2, my: 0.6, px: 1, borderRadius: 2 }}>
            {task.sub_tasks?.length === 0 ? (
              <Fallbacks
                size={60}
                severity="to do"
                title=""
                description="No sub task at the moment"
                sx={{ paddingY: 6 }}
              />
            ) : (
              <>
                {Object.keys(task?.sub_tasks).map((day, index) => (
                  <Box key={index} my={0.6}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor:
                          selectedDay === day && theme.palette.grey[50],
                        ':hover': { backgroundColor: theme.palette.grey[50] },
                        p: 0.6,
                        px: 2,
                        borderRadius: 2,
                      }}
                      onClick={() => handleDayExpanding(day)}
                    >
                      <Typography variant="h5" color="text.primary">
                        {day}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {task.sub_tasks[day].length > 0 && (
                          <Typography
                            variant="body1"
                            color="text.primary"
                            mr={1}
                          >
                            {task.sub_tasks[day].length}
                          </Typography>
                        )}
                        <IconButton>
                          {selectedDay === day ? (
                            <IconChevronDown size="1rem" stroke="1.6" />
                          ) : (
                            <IconChevronRight size="1rem" stroke="1.6" />
                          )}
                        </IconButton>
                      </Box>
                    </Box>

                    <Collapse in={selectedDay === day}>
                      {task.sub_tasks[day].length === 0 ? (
                        <Box
                          sx={{
                            padding: 4,
                            my: 1,
                            borderRadius: 1,
                            backgroundColor: theme.palette.grey[50],
                          }}
                        >
                          <Typography variant="body1">
                            No task on {day}
                          </Typography>
                        </Box>
                      ) : (
                        task.sub_tasks[day].map((subtask, sub_index) => (
                          <Subtask
                            key={sub_index}
                            task={subtask}
                            selected={selectedSubtask}
                            checked={subtask?.status === 'done'}
                            handleSubTaskCompleted={(subtask, newStatus) =>
                              handleSelectedSubtask(
                                subtask,
                                newStatus,
                                subtask?.id,
                              )
                            }
                            statusIsChanging={statusIsChanging}
                            lastTask={
                              sub_index === task.sub_tasks[day].length - 1
                            }
                          />
                        ))
                      )}
                    </Collapse>
                  </Box>
                ))}
              </>
            )}
          </Box>
        }
        remarks={<TaskRemarks task={task} />}
      />
    </DrogaModal>
  );
};

TaskDetailModal.propTypes = {
  open: PropTypes.bool,
  task: PropTypes.object,
  title: PropTypes.string,
  handleClose: PropTypes.func,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  statusIsChanging: PropTypes.bool,
};

DrogaModal.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  children: PropTypes.node,
  handleClose: PropTypes.func,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  submitting: PropTypes.bool,
};

export default TaskDetailModal;
