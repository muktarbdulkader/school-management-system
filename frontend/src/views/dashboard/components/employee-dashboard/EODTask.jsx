import React, { useEffect, useState } from 'react';
import { Box, Checkbox, FormControlLabel, IconButton, Typography } from '@mui/material';
import { IconSquareRounded, IconSquareRoundedCheck, IconX } from '@tabler/icons-react';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import DrogaCard from 'ui-component/cards/DrogaCard';

export const EODTask = ({ task, selected, checked, handleSubTaskCompleted }) => {
  const [statusChanging, setStatusChanging] = useState(false);

  const handleCheckBoxChange = () => {
    if (task.status === 'done') {
      handleChangeStatus('todo');
    } else {
      handleChangeStatus('done');
    }
    setStatusChanging(true);
  };

  const handleSubtaskRemoval = () => {
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
    <DrogaCard
      sx={{
        width: '100%',
        paddingLeft: 0.6,
        my: 1.2,
        backgroundColor: '#fffc',
        backdropFilter: 'blur(10px)',
        py: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          paddingLeft: 1.6,
          transition: 'height 1s ease-out'
        }}
      >
        {statusChanging && selected === task?.id ? (
          <Box sx={{ mr: 3.18, py: 1 }}>
            <ActivityIndicator size={16} />
          </Box>
        ) : (
          <FormControlLabel
            control={
              <Checkbox
                checked={checked}
                onChange={() => handleCheckBoxChange()}
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
            width: '98%'
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ textDecoration: checked && 'line-through', color: checked && '#00B400' }}>
              {task?.title}
            </Typography>

            <Typography variant="subtitle2">{task?.task_title}</Typography>
          </Box>

          <IconButton onClick={() => handleSubtaskRemoval()} disabled={statusChanging}>
            <IconX size="1rem" stroke="1.4" />
          </IconButton>
        </Box>
      </Box>
    </DrogaCard>
  );
};
