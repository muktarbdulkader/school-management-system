import { jwtDecode } from 'jwt-decode';

export const decodeToken = (token) => {
  return jwtDecode(token);
};

export const hasRole = (roles, requiredRole) => {
  return roles.some(role => role.name === requiredRole);
};

export const hasPermission = (permissions, requiredPermission) => {
  return permissions.some(permission => permission.name === requiredPermission);
};
