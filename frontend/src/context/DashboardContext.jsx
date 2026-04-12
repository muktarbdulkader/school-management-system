import React, { createContext, useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckForPendingTasks } from 'utils/check-for-pending-tasks';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const user = useSelector((state) => state.user.user);
  console.log('user', user);

  const [activeDashboard, setActiveDashboard] = useState(
    user?.roles?.includes('teacher')
      ? 'teacher'
      : user?.roles?.includes('parent')
        ? 'parent'
        : user?.roles?.includes('Admin') ? 'admin' : null
  );

  const dispatch = useDispatch();

  const handleChangingDashboard = async (newDashboard, fiscal_year_id) => {
    setActiveDashboard(newDashboard);
    // await CheckForPendingTasks(dispatch, fiscal_year_id);
  };

  return (
    <DashboardContext.Provider
      value={{
        activeDashboard,
        handleChangingDashboard,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboards = () => useContext(DashboardContext);
