import React from 'react';
import { Badge, Box } from '@mui/material';

const BeaconBadge = () => {
  return (
    <Badge
      overlap="circular"
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      badgeContent={
        <Box
          sx={{
            position: 'relative',
            width: 6,
            height: 6,
            backgroundColor: 'red',
            borderRadius: '50%',
            animation: 'pulse 2s infinite ease-out',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)',
                opacity: 1
              },
              '50%': {
                transform: 'scale(1.5)',
                opacity: 0.4
              },
              '100%': {
                transform: 'scale(2)',
                opacity: 0
              }
            }
          }}
        />
      }
    />
  );
};

export default BeaconBadge;
