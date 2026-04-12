import React, { useState } from 'react';
import { Box, Collapse, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { Subtask } from '../Subtask';
import Fallbacks from 'utils/components/Fallbacks';

export const Subtasks = ({ subtasks, onSubtaskStatusChange, statusIsChanging }) => {
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

  const handleSelectedSubtask = (subtask, newStatus, subtaskID) => {
    setSelectedSubTask(subtaskID);
    onSubtaskStatusChange(subtask, newStatus);
  };

  let totalCountSubTasks = 0;
  for (const day in subtasks) {
    totalCountSubTasks += subtasks[day].length;
  }

  const doneTasks = Object.values(subtasks)
    .flat()
    .filter((miniTask) => miniTask.status === 'done');

  const donePercent = (doneTasks.length / totalCountSubTasks) * 100;

  return (
    <Grid container>
      <Grid item xs={12}>
        {totalCountSubTasks > 0 && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" color={theme.palette.text.secondary} mr={1}>
                  {doneTasks.length}
                </Typography>
                <Typography variant="subtitle1" color={theme.palette.text.secondary}>
                  out of
                </Typography>
                <Typography variant="subtitle1" color={theme.palette.text.secondary} ml={1}>
                  {totalCountSubTasks}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                width: '100%',
                height: '6px',
                backgroundColor: theme.palette.success.light,
                borderRadius: 10,
                mb: 2
              }}
            >
              <Box
                sx={{
                  width: `${donePercent}%`,
                  height: '6px',
                  backgroundColor: theme.palette.success.dark,
                  borderRadius: 10,
                  transition: 'width 0.6s ease-out'
                }}
              ></Box>
            </Box>
          </>
        )}

        {totalCountSubTasks === 0 ? (
          <Fallbacks size={60} severity="to do" title="" description="No sub task at the moment" sx={{ paddingY: 6 }} />
        ) : (
          <Box>
            {Object.keys(subtasks).map((day, index) => (
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
                  <Typography variant="h5">{day}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {subtasks[day].length > 0 && (
                      <Typography variant="subtitle2" mr={1}>
                        {subtasks[day].length}
                      </Typography>
                    )}
                    <IconButton>
                      {selectedDay === day ? <IconChevronDown size="1rem" stroke="1.6" /> : <IconChevronRight size="1rem" stroke="1.6" />}
                    </IconButton>
                  </Box>
                </Box>

                <Collapse in={selectedDay === day}>
                  {subtasks[day].length === 0 ? (
                    <Box sx={{ padding: 4, my: 1, borderRadius: 2, backgroundColor: theme.palette.grey[50] }}>
                      <Typography variant="body1">No task on {day}</Typography>
                    </Box>
                  ) : (
                    subtasks[day].map((subtask, sub_index) => (
                      <Subtask
                        key={sub_index}
                        task={subtask}
                        selected={selectedSubtask}
                        checked={subtask?.status === 'done'}
                        handleSubTaskCompleted={(subtask, newStatus) => handleSelectedSubtask(subtask, newStatus, subtask?.id)}
                        statusIsChanging={statusIsChanging}
                        lastTask={sub_index === subtasks[day].length - 1}
                      />
                    ))
                  )}
                </Collapse>
              </Box>
            ))}
          </Box>
        )}
      </Grid>
    </Grid>
  );
};
