import { useSelector } from 'react-redux';

const IsEmployee = () => {
  const user = useSelector((state) => state.user.user);

  if (!user?.roles) return false;

  // Handle both string roles and object roles
  const updatedRoles = user.roles
    .map((role) => {
      // If role is a string, use it directly
      if (typeof role === 'string') {
        return role.trim();
      }
      // If role is an object with name property
      if (role?.name) {
        return role.name.trim();
      }
      // Fallback for invalid roles
      return '';
    })
    .filter((role) => role); // Filter out empty strings

  return updatedRoles.length === 1 && updatedRoles.includes('employee');
};

export default IsEmployee;
