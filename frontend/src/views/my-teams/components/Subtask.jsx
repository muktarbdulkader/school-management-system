import React, { useEffect, useState } from 'react';
import { Box, FormControlLabel, Radio, Typography, useTheme } from '@mui/material';
import { IconCircle } from '@tabler/icons-react';
import { IconCircleCheck } from '@tabler/icons-react';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

export const Subtask = ({ task, selected, checked, lastTask, handleSubTaskCompleted }) => {
  const theme = useTheme();
  const [statusChanging, setStatusChanging] = useState(false);

  const handleCheckBoxChange = () => {
    if (task.status === 'done') {
      handleChangeStatus('todo');
    } else {
      handleChangeStatus('done');
    }
    setStatusChanging(true);
  };

  const handleChangeStatus = (newStatus) => {
    handleSubTaskCompleted(task, newStatus);
  };

  useEffect(() => {
    setStatusChanging(false);
  }, [task?.status]);

  return (
    <Box sx={{ width: '100%', paddingLeft: 0.6, my: 1.7, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingLeft: 0.6 }}>
        {statusChanging && selected === task?.id ? (
          <Box sx={{ mr: 3.18, py: 1 }}>
            <ActivityIndicator size={20} />
          </Box>
        ) : (
          <FormControlLabel
            control={
              <Radio
                checked={checked}
                onChange={() => handleCheckBoxChange()}
                icon={<IconCircle size="1.4rem" stroke="1.4" />}
                checkedIcon={<IconCircleCheck size="1.4rem" stroke="1.4" color="#00B400" />}
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
          <Typography
            variant="body1"
            sx={{ textDecoration: checked && 'line-through', color: checked ? '#00B400' : theme.palette.text.primary }}
          >
            {task?.title}
          </Typography>
        </Box>
      </Box>
      {!lastTask && <Box sx={{ borderLeft: 1.4, borderColor: theme.palette.grey[400], height: 12, marginLeft: 1.7 }}></Box>}
    </Box>
  );
};
