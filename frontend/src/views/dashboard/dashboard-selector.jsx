import { Box, Typography } from '@mui/material';
import { useDashboards } from 'context/DashboardContext';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import SelectorMenu from 'ui-component/menu/SelectorMenu';

const DashboardSelector = () => {
  const { activeDashboard, handleChangingDashboard } = useDashboards();

  const user = useSelector((state) => state.user.user);
  const roles = user?.roles?.map((role) => ({
    label: role.name,
    value: role.name
  }));

  useEffect(() => {
    const hasEmployeeRole = roles?.some((role) => role.value === 'Employee');
    if (!hasEmployeeRole) {
      handleChangingDashboard('Super_Admin');
    }
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
      <Typography variant="body1">View as</Typography>
      <SelectorMenu
        name="dashboard"
        options={roles}
        handleSelection={(event) => handleChangingDashboard(event.target.value)}
        selected={activeDashboard}
        sx={{ color: '#243' }}
      />
    </Box>
  );
};

export default DashboardSelector;
