import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function WhatsNewBanner() {
  return (
    <Box
      sx={{
        bgcolor: '#4263EB',
        color: 'white',
        p: 3,
        borderRadius: 3,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mt: 3,
        boxShadow: 3,
      }}
    >
      <Box sx={{ mb: { xs: 2, sm: 0 } }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 'bold', mb: 0.5, color: 'primary.light' }}
        >
          What's New in the System
        </Typography>
        <Typography variant="body2" sx={{ color: 'primary.gray' }}>
          The grading module has been updated with new features!
        </Typography>
      </Box>
      <Button
        variant="contained"
        sx={{
          bgcolor: 'white',
          color: '#4263EB',
          '&:hover': { bgcolor: '#f0f0f0' },
          py: 1.2,
        }}
      >
        Learn More
      </Button>
    </Box>
  );
}
