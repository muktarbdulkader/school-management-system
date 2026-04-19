import React from 'react';
import { useLocation } from 'react-router-dom';
import { Typography, Button, Box, Alert, Paper } from '@mui/material';
import { Lock, ArrowBack, Home } from '@mui/icons-material';
import Fallbacks from './components/Fallbacks/index';

const Unauthorized = () => {
  const location = useLocation();
  const state = location.state || {};
  const { requiredRole, userRoles, reason } = state;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        p: 4,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: '#ffebee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Lock sx={{ fontSize: 40, color: '#d32f2f' }} />
      </Box>

      <Typography variant="h4" fontWeight="bold" color="#d32f2f" gutterBottom>
        Access Denied
      </Typography>

      <Alert severity="warning" sx={{ mb: 2, maxWidth: 600 }}>
        {reason || "You don't have permission to access this page."}
      </Alert>

      {/* Debug Info */}
      {(requiredRole || (userRoles && userRoles.length > 0)) && (
        <Paper sx={{ p: 2, mb: 3, maxWidth: 600, bgcolor: '#f5f5f5' }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Debug Information:
          </Typography>
          {requiredRole && (
            <Typography variant="body2" color="text.secondary">
              <strong>Required Role:</strong> {requiredRole}
            </Typography>
          )}
          {userRoles && userRoles.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              <strong>Your Roles:</strong> {userRoles.join(', ')}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Check browser console (F12) for more details
          </Typography>
        </Paper>
      )}

      {/* Troubleshooting */}
      <Paper sx={{ p: 2, mb: 3, maxWidth: 600 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Troubleshooting Tips:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Verify your account has the correct role assigned</li>
          <li>Teachers need a Teacher profile linked to their account</li>
          <li>Parents need children linked to their account</li>
          <li>Contact your administrator if you believe this is an error</li>
        </ul>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
        <Button
          variant="contained"
          startIcon={<Home />}
          onClick={() => (window.location.href = '/')}
        >
          Go to Home
        </Button>
      </Box>
    </Box>
  );
};

export default Unauthorized;
