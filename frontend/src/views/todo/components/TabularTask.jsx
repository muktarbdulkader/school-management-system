import React, { useState } from 'react';
import { Box, Collapse, Grid, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import { formatDate } from 'utils/function';
import { Subtask } from './Subtask';
import { IconCaretDownFilled, IconCaretRightFilled, IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react';
import Fallbacks from 'utils/components/Fallbacks';
import StatusSelector from './StatusSelector';

const TaskStatuses = [
  { label: 'Todo', value: 'todo' },
  { label: 'In-progress', value: 'inprogress' },
  { label: 'Done', value: 'done' },
  { label: 'Blocked', value: 'blocked' }
];

export const TabularTask = ({
  task,
  color,
  onChangeStatus,
  onAddSubtask,
  onActionTaken,
  onSubtaskStatusChange,
  statusIsChanging,
  onViewDetail
}) => {
  const theme = useTheme();
  const [showSubtask, setShowSubtask] = useState(false);
  const [selectedSubtask, setSelectedSubTask] = useState(null);
  const bigDevice = useMediaQuery(theme.breakpoints.up('sm'));

  const [selectedDay, setSelectedDay] = useState('');

  const handleDayExpanding = (day) => {
    if (selectedDay === day) {
      setSelectedDay('');
    } else {
      setSelectedDay(day);
    }
  };

  const handleshowSubtask = (event) => {
    event.stopPropagation();
    setShowSubtask(!showSubtask);
  };

  const handleStatusChange = (option) => {
    onChangeStatus(task, option);
  };

  const handleSelectedSubtask = (subtask, newStatus, subtaskID) => {
    setSelectedSubTask(subtaskID);
    onSubtaskStatusChange(subtask, newStatus);
  };

  return (
    <Grid container>
      <Grid item xs={12}>
        <Grid container>
          <Grid
            item
            xs={12}
            sx={{ cursor: 'pointer', ':hover': { backgroundColor: theme.palette.grey[50], transition: 'all 0.3s ease' }, px: 1 }}
            onClick={onViewDetail}
          >
            <Box sx={{ py: 1, borderBottom: 0.2, borderColor: theme.palette.divider }}>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={12} md={4} lg={4} xl={4} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Grid container spacing={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Grid item xs={1.2} sm={1.2} md={2.8} sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton onClick={(event) => handleshowSubtask(event)}>
                        {showSubtask ? <IconCaretDownFilled size="1rem" stroke="1.6" /> : <IconCaretRightFilled size="1rem" stroke="1.6" />}
                      </IconButton>

                      {bigDevice && (
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 2,
                            ml: 1
                          }}
                        >
                          <Box sx={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: color, border: 1, borderColor: 'white' }} />
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={9.2}>
                      <Typography variant="h4" sx={{ cursor: 'pointer', ':hover': { color: theme.palette.primary.main } }}>
                        {task?.title}
                      </Typography>
                      <Typography variant="subtitle2" mt={0.4}>
                        {task?.plan?.kpi?.name}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={12}
                  md={4}
                  lg={4}
                  xl={4}
                  onClick={(event) => handleshowSubtask(event)}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  {task?.sub_tasks?.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', marginY: 0.4 }}>
                      <Typography variant="body2" color={theme.palette.text.secondary}>
                        Sub Tasks
                      </Typography>
                      <Box sx={{ width: 4.43, height: 4.43, borderRadius: 2.6, backgroundColor: 'gray', marginX: 1 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color={theme.palette.text.secondary} mr={1}>
                          {task?.sub_tasks?.filter((miniTask) => miniTask.status === 'done').length}
                        </Typography>
                        <Typography variant="body2" color={theme.palette.text.secondary}>
                          out of
                        </Typography>
                        <Typography variant="body2" color={theme.palette.text.secondary} ml={1}>
                          {task?.sub_tasks?.length}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={12}
                  md={4}
                  lg={2}
                  xl={2}
                  onClick={(event) => handleshowSubtask(event)}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <Typography variant="body1" color={theme.palette.text.secondary}>
                    {task?.date ? formatDate(task?.date).formattedDate : ''}
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={12}
                  md={2}
                  lg={2}
                  xl={2}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
                >
                  <StatusSelector
                    name="status"
                    options={TaskStatuses}
                    selected={task.status}
                    handleSelection={(option) => handleStatusChange(option)}
                    onActionTaken={onActionTaken}
                    hideStatusOptions={task?.status !== 'pending'}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
          {showSubtask && (
            <Grid item xs={12} sx={{ py: 0.4 }}>
              <Box sx={{ marginY: 1 }}>
                {task.sub_tasks?.length === 0 ? (
                  <Fallbacks size={60} severity="to do" title="" description="No sub task at the moment" sx={{ paddingY: 6 }} />
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
                            backgroundColor: selectedDay === day && theme.palette.grey[100],
                            ':hover': { backgroundColor: theme.palette.grey[50] },
                            p: 1,
                            borderRadius: 2
                          }}
                          onClick={() => handleDayExpanding(day)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {selectedDay === day ? (
                              <IconChevronDown size="1rem" stroke="1.6" />
                            ) : (
                              <IconChevronRight size="1rem" stroke="1.6" />
                            )}
                            <Typography variant="h5" ml={1}>
                              {day}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {task.sub_tasks[day].length > 0 && (
                              <Typography variant="subtitle2" color="text.primary" mr={1}>
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
                              <IconPlus size="1rem" />{' '}
                            </IconButton>
                          </Box>
                        </Box>

                        <Collapse in={selectedDay === day}>
                          {task.sub_tasks[day].length === 0 ? (
                            <Box sx={{ padding: 4, my: 1, borderRadius: 2, backgroundColor: theme.palette.grey[50] }}>
                              <Typography variant="body1">No task on {day}</Typography>
                            </Box>
                          ) : (
                            task.sub_tasks[day].map((subtask, sub_index) => (
                              <Subtask
                                key={sub_index}
                                task={subtask}
                                selected={selectedSubtask}
                                checked={subtask?.status === 'done'}
                                handleSubTaskCompleted={(subtask, newStatus) => handleSelectedSubtask(subtask, newStatus, subtask?.id)}
                                statusIsChanging={statusIsChanging}
                                lastTask={sub_index === task.sub_tasks[day].length - 1}
                              />
                            ))
                          )}
                        </Collapse>
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};
