import React from 'react';
import { Navigate } from 'react-router-dom';
import { getRolesAndPermissionsFromToken } from './utils/auth/getRolesAndPermissionsFromToken';
import { useSelector } from 'react-redux';

/**
 * Enhanced Protected component with better role detection
 */
const Protected = ({ children, requiredRole, requiredPermission }) => {
  const reduxUser = useSelector((state) => state?.user?.user);
  const tokenRoles = getRolesAndPermissionsFromToken() || [];

  // Combine roles from token and Redux
  const tokenRoleNames = tokenRoles.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase());
  const reduxRoles = reduxUser?.roles?.map(r => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()) || [];
  const allRoles = [...new Set([...tokenRoleNames, ...reduxRoles])];

  // Detect role from profiles if no explicit roles
  let detectedRole = null;
  if (reduxUser?.teacher_profiles || reduxUser?.teacher_profile) detectedRole = 'teacher';
  else if (reduxUser?.student_profiles || reduxUser?.student_profile) detectedRole = 'student';
  else if (reduxUser?.parent_profiles || reduxUser?.parent_profile) detectedRole = 'parent';
  else if (reduxUser?.is_superuser) detectedRole = 'admin';

  if (detectedRole && !allRoles.includes(detectedRole)) {
    allRoles.push(detectedRole);
  }

  console.log('[Protected] All detected roles:', allRoles);

  // Check required role
  const hasRequiredRole = requiredRole
    ? allRoles.some(r => r === requiredRole.toLowerCase())
    : true;

  // Check required permission (simplified - uses token roles)
  const hasRequiredPermission = requiredPermission
    ? tokenRoles.some((role) => role.permissions?.some((permission) => permission.name === requiredPermission))
    : true;

  if (!hasRequiredRole || !hasRequiredPermission) {
    console.log('[Protected] Access denied - required:', requiredRole, 'have:', allRoles);
    return <Navigate to="/unauthorized" state={{
      requiredRole,
      userRoles: allRoles,
      reason: !hasRequiredRole ? `Requires ${requiredRole} role` : 'Missing required permission'
    }} />;
  }

  return children;
};

export default Protected;

