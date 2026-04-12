// utils/auth/hasPermission.js
import { useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';

/** Pure helper: call this when you already have permissions array */
export function hasPermissionFrom(permissions = [], permissionName, userRoles = []) {
  // Check if user is super_admin or admin - they have all permissions
  const normalizedRoles = (userRoles || []).map(role => 
    typeof role === 'string' ? role.toLowerCase() : (role?.name || '').toLowerCase()
  );
  
  if (normalizedRoles.includes('super_admin') || normalizedRoles.includes('superadmin')) {
    return true;
  }
  
  const alwaysAllowed = [
    'create:kpitracker',
    'update:kpitracker',
    'delete:lesson',
    'delete:kpitracker',
  ];
  if (alwaysAllowed.includes(permissionName)) return true;
  return (permissions || []).some((p) => p?.name === permissionName);
}

/**
 * Hook: call this at the top of your component.
 * Returns { permissions, hasPermission } where hasPermission is a stable function.
 */
export function usePermissions() {
  const permissions = useSelector((state) => state?.user?.permissions || []);
  const userRoles = useSelector((state) => state?.user?.user?.roles || []);

  // memoize alwaysAllowed once
  const alwaysAllowed = useMemo(
    () => [
      'create:kpitracker',
      'update:kpitracker',
      'delete:lesson',
      'delete:kpitracker',
    ],
    []
  );

  // stable function to check a permission
  const hasPermission = useCallback(
    (permissionName) => {
      // Check if user is super_admin or admin - they have all permissions
      const normalizedRoles = (userRoles || []).map(role => 
        typeof role === 'string' ? role.toLowerCase() : (role?.name || '').toLowerCase()
      );
      
      if (normalizedRoles.includes('super_admin') || normalizedRoles.includes('superadmin')) {
        return true;
      }
      
      if (alwaysAllowed.includes(permissionName)) return true;
      return (permissions || []).some((p) => p?.name === permissionName);
    },
    [permissions, userRoles, alwaysAllowed]
  );

  return { permissions, hasPermission };
}

export default hasPermissionFrom;
