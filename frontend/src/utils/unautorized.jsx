import React from 'react';
import { Typography, Button } from '@mui/material';
import Fallbacks from './components/Fallbacks/index'; // Adjust the import path as needed

const Unauthorized = () => {
  return (
    <Fallbacks
      severity="error" // Choose a severity that fits your use case, e.g., "error"
      title="Access Denied"
      description="You do not have permission to view this page."
      sx={{ padding: 2 }}
    >
      <Button variant="contained" color="primary" onClick={() => (window.location.href = '/')}>
        Go to Home
      </Button>
    </Fallbacks>
  );
};

export default Unauthorized;
