import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Collapse,
  Grid,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { formatDate, getStatusColor } from 'utils/function';
import { Subtask } from './Subtask';
import {
  IconCaretDownFilled,
  IconCaretRightFilled,
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconX,
  IconMessageReply,
} from '@tabler/icons-react';
import Fallbacks from 'utils/components/Fallbacks';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

export const TabularTask = ({
  task,
  onActionTaken,
  onSubtaskStatusChange,
  statusIsChanging,
  onViewDetail,
}) => {
  const theme = useTheme();

  const bigDevice = useMediaQuery(theme.breakpoints.up('sm'));
  const [showSubtask, setShowSubtask] = useState(false);
  const [selectedSubtask, setSelectedSubTask] = useState(null);

  const [actionInfo, setActionInfo] = useState({
    approving: false,
    rejecting: false,
  });

  const [selectedDay, setSelectedDay] = useState('');

  const handleDayExpanding = (day) => {
    if (selectedDay === day) {
      setSelectedDay('');
    } else {
      setSelectedDay(day);
    }
  };

  const handleshowSubtask = () => {
    setShowSubtask(!showSubtask);
  };

  const handleSelectedSubtask = (subtask, newStatus, subtaskID) => {
    setSelectedSubTask(subtaskID);
    onSubtaskStatusChange(subtask, newStatus);
  };

  const handleApprove = () => {
    setActionInfo((prevState) => ({ ...prevState, approving: true }));
    onActionTaken('approved');
  };

  const handleReject = () => {
    setActionInfo((prevState) => ({ ...prevState, rejecting: true }));
    onActionTaken('rejected');
  };

  let totalCountSubTasks = 0;
  for (const day in task.sub_tasks) {
    totalCountSubTasks += task.sub_tasks[day].length;
  }

  const countDoneSubtasks = (task) => {
    let doneCount = 0;
    for (const day in task.sub_tasks) {
      doneCount += task.sub_tasks[day].filter(
        (subtask) => subtask.status === 'done',
      ).length;
    }
    return doneCount;
  };

  return (
    <Grid container>
      <Grid item xs={12}>
        <Grid container>
          <Grid item xs={12} sx={{ cursor: 'pointer' }}>
            <DrogaCard
              sx={{ ':hover': { backgroundColor: theme.palette.grey[50] } }}
            >
              <Box>
                <Grid container spacing={1}>
                  <Grid
                    item
                    xs={12}
                    sm={12}
                    md={4}
                    lg={4}
                    xl={4}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Grid
                      container
                      spacing={1}
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Grid
                        item
                        xs={1.2}
                        sm={1.2}
                        md={2.8}
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <IconButton onClick={handleshowSubtask}>
                          {showSubtask ? (
                            <IconCaretDownFilled size="1rem" stroke="1.6" />
                          ) : (
                            <IconCaretRightFilled size="1rem" stroke="1.6" />
                          )}
                        </IconButton>

                        {bigDevice && (
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: 7,
                              backgroundColor: getStatusColor(task.status),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 2,
                              ml: 1,
                            }}
                            onClick={handleshowSubtask}
                          >
                            <Box
                              sx={{
                                width: 11,
                                height: 11,
                                borderRadius: 5.5,
                                backgroundColor: getStatusColor(task.status),
                                border: 1,
                                borderColor: 'white',
                              }}
                            />
                          </Box>
                        )}
                      </Grid>

                      <Grid item xs={9.2}>
                        <Typography
                          variant="h4"
                          onClick={onViewDetail}
                          sx={{
                            cursor: 'pointer',
                            ':hover': { color: theme.palette.primary.main },
                          }}
                        >
                          {task?.title}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          mt={0.4}
                          onClick={handleshowSubtask}
                        >
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
                    onClick={handleshowSubtask}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    {task?.sub_task_count > 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          marginY: 0.4,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color={theme.palette.text.secondary}
                        >
                          Sub Task Done
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
                            {countDoneSubtasks(task)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={theme.palette.text.secondary}
                          >
                            out of
                          </Typography>
                          <Typography
                            variant="body2"
                            color={theme.palette.text.secondary}
                            ml={1}
                          >
                            {totalCountSubTasks}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={12}
                    md={2}
                    lg={2}
                    xl={2}
                    onClick={handleshowSubtask}
                  >
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {formatDate(task?.date).formattedDate}
                    </Typography>
                    <Typography variant="subtitle2">Date created</Typography>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={12}
                    md={2}
                    lg={2}
                    xl={2}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <IconMessageReply
                      size="1.4rem"
                      stroke="2"
                      style={{ color: theme.palette.grey[150] }}
                      onClick={onViewDetail}
                    />

                    {task.status === 'pending' ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <IconButton onClick={handleApprove} title="Approve">
                          {actionInfo.approving ? (
                            <ActivityIndicator size={16} />
                          ) : (
                            <IconCircleCheck
                              size="1.4rem"
                              stroke="2"
                              style={{ color: 'green' }}
                            />
                          )}
                        </IconButton>
                        <IconButton onClick={handleReject} title="Reject">
                          {actionInfo.rejecting ? (
                            <ActivityIndicator size={16} />
                          ) : (
                            <IconX
                              size="1.4rem"
                              stroke="1.6"
                              style={{ color: 'red' }}
                            />
                          )}
                        </IconButton>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        color={getStatusColor(task.status)}
                        sx={{ textTransform: 'capitalize' }}
                        onClick={handleshowSubtask}
                      >
                        {task.status}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </DrogaCard>
          </Grid>

          <Grid item xs={12}>
            <Collapse in={showSubtask}>
              <Box
                sx={{
                  margin: 2,
                  my: 1.6,
                  p: 1,
                  borderRadius: 2,
                  backgroundColor: theme.palette.grey[100],
                }}
              >
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
                            ':hover': {
                              backgroundColor: theme.palette.grey[50],
                            },
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
            </Collapse>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

TabularTask.propTypes = {
  task: PropTypes.object.isRequired,
  onActionTaken: PropTypes.func.isRequired,
  onSubtaskStatusChange: PropTypes.func.isRequired,
  statusIsChanging: PropTypes.bool.isRequired,
  onViewDetail: PropTypes.func.isRequired,
};
