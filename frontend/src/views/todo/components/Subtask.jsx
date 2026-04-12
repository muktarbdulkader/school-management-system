import React, { useEffect, useState } from 'react';
import { Box, Checkbox, FormControlLabel, IconButton, Typography, useTheme } from '@mui/material';
import { IconSquareRounded, IconSquareRoundedCheck, IconTrash } from '@tabler/icons-react';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

export const Subtask = ({ task, selected, checked, lastTask, handleSubTaskCompleted, statusIsChanging }) => {
  const theme = useTheme();
  const [statusChanging, setStatusChanging] = useState(false);

  const handleCheckBoxChange = (event) => {
    event.stopPropagation();
    if (task.status === 'done') {
      handleChangeStatus('todo');
    } else {
      handleChangeStatus('done');
    }
    setStatusChanging(true);
  };

  const handleSubtaskRemoval = (event) => {
    event.stopPropagation();
    handleChangeStatus('remove');
    setStatusChanging(true);
  };

  const handleChangeStatus = (newStatus) => {
    handleSubTaskCompleted(task, newStatus);
  };

  useEffect(() => {
    setStatusChanging(false);
  }, [task?.status]);

  return (
    <Box sx={{ width: '100%', paddingLeft: 0.6, my: 0.7 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingLeft: 0.6 }}>
        {statusChanging && selected === task?.id ? (
          <Box sx={{ mr: 3.18, py: 1 }}>
            <ActivityIndicator size={20} />
          </Box>
        ) : (
          <FormControlLabel
            control={
              <Checkbox
                checked={checked}
                onChange={(event) => handleCheckBoxChange(event)}
                icon={<IconSquareRounded size="1.4rem" stroke="1.4" />}
                checkedIcon={<IconSquareRoundedCheck size="1.4rem" stroke="1.4" color="#00B400" />}
              />
            }
          />
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '98%',
            borderBottom: 0.2,
            borderColor: theme.palette.divider,
            mt: 1,
            pb: 1
          }}
        >
          <Typography variant="body1" sx={{ textDecoration: checked && 'line-through', color: checked && '#00B400' }}>
            {task?.title}
          </Typography>

          <IconButton onClick={(event) => handleSubtaskRemoval(event)} disabled={statusChanging}>
            <IconTrash size="1rem" stroke="1.4" />
          </IconButton>
        </Box>
      </Box>
      {!lastTask && <Box sx={{ borderLeft: 1.4, borderColor: theme.palette.grey[400], height: 12, marginLeft: 1.7 }}></Box>}
    </Box>
  );
};
