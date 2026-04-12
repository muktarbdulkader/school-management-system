import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const EmptyStateGroups = () => {
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
        No group messages
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Start a new group conversation
      </Typography>
      <Button variant="contained" color="primary" sx={{ mt: 2 }}>
        Create Group
      </Button>
    </Box>
  );
};

export default EmptyStateGroups;
