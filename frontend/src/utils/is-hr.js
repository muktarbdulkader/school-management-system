import { useSelector } from 'react-redux';

const IsHr = () => {
  const user = useSelector((state) => state.user.user);

  if (user?.roles) {
    const updatedRoles = user.roles.map((role) => role.name.trim().toLowerCase());
    return updatedRoles.length === 1 && updatedRoles.includes('HR');
  }
  return false;
};

export default IsHr;
