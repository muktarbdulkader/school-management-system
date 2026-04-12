import { useSelector } from 'react-redux';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  getHighestRole,
  getRolePriority 
} from '../config/rolePermissions';

/**
 * Custom hook for checking user permissions
 * @returns {Object} Permission checking functions
 */
export const usePermissions = () => {
  const user = useSelector((state) => state.user.user);
  const userRoles = user?.roles || [];

  return {
    // Check single permission
    can: (permission) => hasPermission(userRoles, permission),
    
    // Check if user has any of the permissions
    canAny: (permissions) => hasAnyPermission(userRoles, permissions),
    
    // Check if user has all permissions
    canAll: (permissions) => hasAllPermissions(userRoles, permissions),
    
    // Get user's highest role
    highestRole: getHighestRole(userRoles),
    
    // Get user's role priority
    rolePriority: getHighestRole(userRoles) ? getRolePriority(getHighestRole(userRoles)) : 0,
    
    // Check if user has specific role
    hasRole: (role) => {
      const normalizedRoles = userRoles.map(r => 
        typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase()
      );
      return normalizedRoles.includes(role.toLowerCase());
    },
    
    // Get all user roles
    roles: userRoles,
  };
};

export default usePermissions;
