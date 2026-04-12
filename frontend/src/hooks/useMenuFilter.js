import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { hasRole, hasPermission } from 'store/permissionUtils';
import menuItem from 'menu-items';

const useMenuFilter = () => {
  const user = useSelector((state) => state.user.user);
  const [filteredNavItems, setFilteredNavItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const filterMenuItems = (items) => {
    return items
      .filter((item) => item !== null && item !== undefined) // Filter out null/undefined items first
      .map((item) => {
        if (!item) return null; // Additional safety check

        if (item.type === 'group') {
          if (item.requiredRoles && !hasRole(user.roles, item.requiredRoles)) {
            return null;
          }
          const filteredChildren = filterMenuItems(item.children || []); // Handle undefined children
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return null;
        }

        if (item.requiredRoles && !hasRole(user.roles, item.requiredRoles)) {
          return null;
        }
        if (
          item.requiredPermissions &&
          !hasPermission(user.roles, item.requiredPermissions)
        ) {
          return null;
        }
        return item;
      })
      .filter((item) => item !== null);
  };

  useEffect(() => {
    if (user && user.roles) {
      setLoading(true);
      const filteredItems = filterMenuItems(menuItem.items || []); // Handle undefined items
      setFilteredNavItems(filteredItems);
      setLoading(false);
    }
  }, [user]);

  return { filteredNavItems, loading };
};

export default useMenuFilter;
