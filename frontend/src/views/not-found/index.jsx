// src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';

const NotFound = () => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" textAlign="center">
      <Typography variant="h1" color="primary" gutterBottom>
        404
      </Typography>
      <Typography variant="h3"  gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        Oops! The page you are looking for doesn't exist.
      </Typography>
      <Button variant="text" color="primary" component={Link} to="/">
        Go to Home
      </Button>
    </Box>
  );
};

export default NotFound;
