import React, { useState } from 'react';
import {
  Box,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { EODTask } from './EODTask';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import PropTypes from 'prop-types';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import taskDoneSound from 'assets/audio/done_sound.wav';

export const MyDay = ({
  isLoading,
  error,
  tasks,
  onRefresh,
  selectedDay,
  onDayChange,
}) => {
  const theme = useTheme();
  const [selectedSubtask, setSelectedSubTask] = useState(null);
  const [showDoneTasks, setShowDoneTasks] = useState(false);

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const formattedDate = selectedDay
    ? `${selectedDay}, ${format(new Date(), 'MMMM d')}`
    : format(new Date(), 'EEEE, MMMM d');

  const todoTasks = tasks.filter((task) => task.status === 'todo');
  const doneTask = tasks.filter((task) => task.status === 'done');

  const handleShowCompletedTasks = () => {
    setShowDoneTasks(!showDoneTasks);
  };

  const handleSelectedSubtask = (subtask, newStatus, subtaskID) => {
    setSelectedSubTask(subtaskID);
    handleTaskStatusMiddleware(subtask, newStatus);
  };

  const PlayTaskDoneBeep = async () => {
    const beepSound = new Audio(taskDoneSound);
    beepSound.volume = '0.075';
    beepSound.play();
  };

  const handleTaskStatusMiddleware = async (task, statuses) => {
    if (statuses === 'remove') {
      handleSubtaskRemoval(task?.id);
    } else {
      if (statuses === 'done') {
        await PlayTaskDoneBeep();
      }
      handleSubTaskStatusChange(task, statuses);
    }
  };

  const handleSubTaskStatusChange = async (task, statuses) => {
    const token = await GetToken('token');
    const Api = Backend.api + Backend.employeeSubTaskStatus + task?.id;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const data = {
      status: statuses,
    };

    fetch(Api, {
      method: 'POST',
      headers: header,
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data?.message);
          onRefresh();
        } else {
          toast.info(response.data?.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const handleSubtaskRemoval = async (id) => {
    const token = await GetToken('token');
    const Api = Backend.api + Backend.employeeSubTasks + id;

    const headers = {
      Authorization: `Bearer` + token,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'DELETE',
      headers: headers,
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.data.message);
          onRefresh();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  return (
    <Box sx={{ minHeight: '100%', borderRadius: { xs: 0, sm: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          p: 2,
          pb: 14,
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 400,
            mb: 1,
          }}
        >
          <Typography variant="h3" color={theme.palette.common.white}>
            My Day
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedDay}
              onChange={(e) => onDayChange(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Select day' }}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: theme.palette.common.white,
                '& .MuiSelect-icon': {
                  color: theme.palette.common.white,
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                },
              }}
            >
              {daysOfWeek.map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color={theme.palette.common.white} mt={0.6}>
          {formattedDate}
        </Typography>

        {/* Rest of your component remains the same */}
        <Grid container>
          <Grid item xs={12} pt={3}>
            {isLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                }}
              >
                <ActivityIndicator size={20} />
              </Box>
            ) : error ? (
              <ErrorPrompt
                title="Server Error"
                message="There is error with fetching your today task"
                size={140}
              />
            ) : tasks.length === 0 ? (
              <Fallbacks
                severity="tasks"
                title=""
                description="Tasks are not found"
                sx={{ paddingTop: 6 }}
              />
            ) : (
              <>
                {todoTasks.map((task) => (
                  <EODTask
                    key={task.id}
                    task={task}
                    selected={selectedSubtask}
                    checked={task.status === 'done'}
                    handleSubTaskCompleted={(task, newStatus) =>
                      handleSelectedSubtask(task, newStatus, task?.id)
                    }
                  />
                ))}

                {doneTask.length > 0 && (
                  <Box>
                    <Box
                      sx={{
                        width: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#0008',
                        borderRadius: 2,
                        pr: 2,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleShowCompletedTasks()}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton>
                          {showDoneTasks ? (
                            <IconChevronDown
                              size="1.4rem"
                              stroke="1.8"
                              color={theme.palette.common.white}
                            />
                          ) : (
                            <IconChevronRight
                              size="1.4rem"
                              stroke="1.8"
                              color={theme.palette.common.white}
                            />
                          )}
                        </IconButton>

                        <Typography
                          variant="subtitle1"
                          color={theme.palette.common.white}
                        >
                          Completed
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        color={theme.palette.common.white}
                      >
                        {doneTask.length}
                      </Typography>
                    </Box>

                    <Collapse in={showDoneTasks}>
                      {doneTask.map((task) => (
                        <EODTask
                          key={task.id}
                          task={task}
                          selected={selectedSubtask}
                          checked={task.status === 'done'}
                          handleSubTaskCompleted={(task, newStatus) =>
                            handleSelectedSubtask(task, newStatus, task?.id)
                          }
                        />
                      ))}
                    </Collapse>
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

MyDay.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.bool,
  tasks: PropTypes.array,
  onRefresh: PropTypes.func,
  selectedDay: PropTypes.string,
  onDayChange: PropTypes.func,
};
