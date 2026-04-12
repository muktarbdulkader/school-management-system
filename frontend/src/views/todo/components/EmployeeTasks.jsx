import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Badge,
  Box,
  Collapse,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import DrogaCard from 'ui-component/cards/DrogaCard';
import {
  IconCalendarMonth,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
} from '@tabler/icons-react';
import { formatDate } from 'utils/function';
import { Subtask } from './Subtask';
import Fallbacks from 'utils/components/Fallbacks';
import StatusSelector from './StatusSelector';

const TaskStatuses = [
  { label: 'Todo', value: 'todo' },
  { label: 'In-progress', value: 'inprogress' },
  { label: 'Done', value: 'done' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Expired', value: 'expired' },
];

export const EmployeeTasks = ({
  task,
  color,
  onChangeStatus,
  onActionTaken,
  onAddSubtask,
  onSubtaskStatusChange,
  statusIsChanging,
  onViewDetail,
}) => {
  const theme = useTheme();
  const [viewSubtasks, setViewSubtasks] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSubtask, setSelectedSubTask] = useState(null);

  const handleSubtaskExpanding = (event) => {
    event.stopPropagation();
    if (viewSubtasks) {
      setViewSubtasks(false);
    } else {
      setViewSubtasks(true);
    }
  };

  const handleDayExpanding = (event, day) => {
    event.stopPropagation();
    if (selectedDay === day) {
      setSelectedDay('');
    } else {
      setSelectedDay(day);
    }
  };

  const handleStatusChange = (option) => {
    onChangeStatus(task, option);
  };

  const handleSelectedSubtask = (subtask, newStatus, subtaskID) => {
    setSelectedSubTask(subtaskID);
    onSubtaskStatusChange(subtask, newStatus);
  };

  let totalCountSubTasks = 0;
  for (const day in task.sub_tasks) {
    totalCountSubTasks += task.sub_tasks[day].length;
  }

  return (
    <DrogaCard
      sx={{
        my: 1.6,
        padding: 1.6,
        py: 1.2,
        transition: 'all 0.2s ease-in-out',
        ':hover': { backgroundColor: theme.palette.grey[50] },
        cursor: 'pointer',
      }}
    >
      <Box onClick={onViewDetail}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginY: 0.4,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              cursor: 'pointer',
              ':hover': { color: theme.palette.primary.main },
            }}
            color={theme.palette.text.primary}
            mt={1}
          >
            {task?.title}
          </Typography>

          <StatusSelector
            name="status"
            options={TaskStatuses}
            selected={task.status}
            handleSelection={(option) => handleStatusChange(option)}
            onActionTaken={onActionTaken}
            hideStatusOptions={task?.status !== 'pending'}
          />
        </Box>
        <Typography
          variant="subtitle1"
          color={theme.palette.text.secondary}
          mt={0}
        >
          {task?.plan?.kpi?.name}
        </Typography>

        {task?.sub_tasks.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', marginY: 0.4 }}>
            <Typography variant="body2" color={theme.palette.text.secondary}>
              Sub Tasks
            </Typography>
            <Box
              sx={{
                width: 4.43,
                height: 4.43,
                borderRadius: 2.6,
                backgroundColor: 'gray',
                marginX: 1,
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                mr={1}
              >
                {
                  task?.sub_tasks.filter(
                    (miniTask) => miniTask.status === 'done',
                  ).length
                }
              </Typography>
              <Typography variant="body2" color={theme.palette.text.secondary}>
                out of
              </Typography>
              <Typography
                variant="body2"
                color={theme.palette.text.secondary}
                ml={1}
              >
                {task?.sub_tasks.length}
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', marginY: 1.2 }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 11,
                height: 11,
                borderRadius: 5.5,
                backgroundColor: color,
                border: 1,
                borderColor: 'white',
              }}
            />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{ textTransform: 'capitalize', marginLeft: 1.2 }}
          >
            {task?.status}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconCalendarMonth size="1.1rem" stroke="1.4" />
            <Typography variant="subtitle2" sx={{ marginLeft: 1 }}>
              {task?.date ? formatDate(task?.date).formattedDate : ''}
            </Typography>
          </Box>
          <Box
            onClick={(event) => handleSubtaskExpanding(event)}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              p: 1,
            }}
          >
            <Badge
              badgeContent={totalCountSubTasks}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: theme.palette.grey[100],
                  color: theme.palette.primary[800],
                },
              }}
            />
            <Typography
              variant="subtitle2"
              color="text.primary"
              sx={{ marginLeft: 2 }}
            >
              {' '}
              Subtasks{' '}
            </Typography>
            {viewSubtasks ? (
              <IconChevronDown size="1rem" stroke="1.8" />
            ) : (
              <IconChevronRight size="1rem" stroke="1.8" />
            )}
          </Box>
        </Box>
      </Box>

      <Collapse in={viewSubtasks}>
        <>
          <div
            style={{
              width: '100%',
              height: 0.6,
              marginTop: 10,
              backgroundColor: theme.palette.divider,
            }}
          />
          <Box sx={{ marginY: 1 }}>
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
                  <Box key={index} my={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor:
                          selectedDay === day && theme.palette.grey[100],
                        ':hover': { backgroundColor: theme.palette.grey[50] },
                        p: 1,
                        borderRadius: 2,
                      }}
                      onClick={(event) => handleDayExpanding(event, day)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {selectedDay === day ? (
                          <IconChevronDown size="1rem" stroke="1.6" />
                        ) : (
                          <IconChevronRight size="1rem" stroke="1.6" />
                        )}
                        <Typography
                          variant="subtitle1"
                          color="text.primary"
                          ml={1}
                        >
                          {day}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {task.sub_tasks[day].length > 0 && (
                          <Typography
                            variant="subtitle2"
                            color="text.primary"
                            mr={1}
                          >
                            {task.sub_tasks[day].length}
                          </Typography>
                        )}

                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();
                            onAddSubtask(day);
                          }}
                          title="Add Subtask"
                        >
                          {' '}
                          <IconPlus size="1rem" />{' '}
                        </IconButton>
                      </Box>
                    </Box>

                    <Collapse in={selectedDay === day}>
                      {task.sub_tasks[day].length === 0 ? (
                        <Box
                          sx={{
                            padding: 4,
                            my: 1,
                            borderRadius: 2,
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
        </>
      </Collapse>
    </DrogaCard>
  );
};
EmployeeTasks.propTypes = {
  task: PropTypes.shape({
    title: PropTypes.string,
    status: PropTypes.string,
    plan: PropTypes.shape({
      kpi: PropTypes.shape({
        name: PropTypes.string,
      }),
    }),
    date: PropTypes.string,
    sub_tasks: PropTypes.objectOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          status: PropTypes.string,
        }),
      ),
    ),
  }).isRequired,
  color: PropTypes.string,
  onChangeStatus: PropTypes.func.isRequired,
  onActionTaken: PropTypes.func.isRequired,
  onAddSubtask: PropTypes.func.isRequired,
  onSubtaskStatusChange: PropTypes.func.isRequired,
  statusIsChanging: PropTypes.bool,
  onViewDetail: PropTypes.func.isRequired,
};
