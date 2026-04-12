import React from 'react';
import { Box, Typography } from '@mui/material';

const EmptyStateStarted = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h6" color="text.secondary">
        No sent messages
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Messages you send will appear here
      </Typography>
    </Box>
  );
};

export default EmptyStateStarted;
