import React from 'react';
import { Box, Stack } from '@mui/material';
import { IconCircle, IconCircleCheckFilled, IconCircleX, IconInfoCircle } from '@tabler/icons-react';

const TaskProgress = ({ numberOfSteps, status }) => {
  const steps = Array.from({ length: numberOfSteps - 1 }, (_, index) => (
    <React.Fragment key={index}>
      <IconCircleCheckFilled size="1.1rem" stroke="2" style={{ color: 'green' }} />
      <Box
        sx={{
          width: 12,
          height: 2,
          backgroundColor: 'green'
        }}
      />
    </React.Fragment>
  ));

  const lastStepIcon =
    status === 'approved' ? (
      <IconCircleCheckFilled size="1.1rem" stroke="2" style={{ color: 'green' }} />
    ) : status === 'rejected' ? (
      <IconCircleX size="1.1rem" stroke="2" style={{ color: 'red' }} />
    ) : status === 'amended' ? (
      <IconInfoCircle size="1.1rem" stroke="2" style={{ color: 'orange' }} />
    ) : (
      <IconCircle size="1.1rem" stroke="2" style={{ color: 'gray' }} />
    );

  return (
    <Stack direction="row" alignItems="center">
      {steps}
      {lastStepIcon}
    </Stack>
  );
};

export default TaskProgress;
