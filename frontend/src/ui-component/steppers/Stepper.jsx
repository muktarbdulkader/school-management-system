import React from 'react';
import { Box, Stack, styled } from '@mui/material';
import { IconCircle, IconCircleCheckFilled } from '@tabler/icons-react';

const RadiatingStepIcon = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '1.1rem',
  height: '1.1rem',
  borderRadius: '50%',
  backgroundColor: 'green',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `pulse 1.5s infinite`,

  '@keyframes pulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.5)' },
    '70%': { boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' }
  }
}));

export const TaskProgress = ({ numberOfSteps, currentIndex }) => {
  const steps = Array.from({ length: numberOfSteps - 1 }, (_, index) => (
    <React.Fragment key={index}>
      {index < currentIndex ? (
        <IconCircleCheckFilled size="1.2rem" stroke="1.2" style={{ color: 'green' }} />
      ) : index === currentIndex ? (
        <RadiatingStepIcon />
      ) : (
        <IconCircle size="1.2rem" stroke="1.2" style={{ color: 'gray' }} />
      )}

      <Box
        sx={{
          width: 12,
          height: 2,
          backgroundColor: index < currentIndex ? 'green' : 'gray'
        }}
      />
    </React.Fragment>
  ));

  const lastStepIcon =
    numberOfSteps === currentIndex + 1 ? <RadiatingStepIcon /> : <IconCircle size="1.2rem" stroke="1.2" style={{ color: 'gray' }} />;

  return (
    <Stack direction="row" alignItems="center" ml={3} mt={-1}>
      {steps}
      {lastStepIcon}
    </Stack>
  );
};
