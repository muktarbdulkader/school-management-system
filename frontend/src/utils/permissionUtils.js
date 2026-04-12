// Check if the user has one of the required roles
export const hasRole = (userRoles, requiredRole) => {
    return userRoles.includes(requiredRole);
};

// Check if the user has one of the required permissions
export const hasPermission = (userRoles, requiredPermission) => {
    return userRoles.some((role) => role.permissions.includes(requiredPermission));
};
