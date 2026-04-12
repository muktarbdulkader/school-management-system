import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { Box, Typography } from '@mui/material';
import Fallbacks from 'utils/components/Fallbacks';

/**
 * Protected Route Component
 * Restricts access based on user permissions
 */
const ProtectedRoute = ({ 
  children, 
  permission, 
  permissions, 
  requireAll = false,
  fallbackPath = '/dashboard',
  showFallback = true 
}) => {
  const { can, canAny, canAll } = usePermissions();

  let hasAccess = true;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (!hasAccess) {
    if (showFallback) {
      return (
        <Box
          sx={{
            height: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Fallbacks
            severity="error"
            title="Access Denied"
            description="You don't have permission to access this page"
          />
        </Box>
      );
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
