import React from 'react';
import { Box, Typography } from '@mui/material';

const EmptyStateAll = () => {
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
        Select a message to view details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Choose a message from the list to see its contents here
      </Typography>
    </Box>
  );
};

export default EmptyStateAll;
