import React from 'react';
import { Box, Typography } from '@mui/material';

const EmptyStateUnread = () => {
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
        No unread messages
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        You're all caught up!
      </Typography>
    </Box>
  );
};

export default EmptyStateUnread;
