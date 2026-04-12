import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import PageContainer from 'ui-component/MainPage';
import EmployeeReport from './employee';
import SuperAdminDashboard from 'views/dashboard/superadmin';
import ManagerReport from './manager';
import ExportReport from './components/export-report';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import { ToastContainer } from 'react-toastify';

const ActiveUser = () => {
  const user = useSelector((state) => state.user.user);
  const [roles, setRoles] = useState(['Employee']);

  useEffect(() => {
    if (user && user.roles) {
      const updatedRoles = user.roles.map((role) => role.name);
      setRoles(updatedRoles);
    }
  }, [user]);

  let UserReport = <></>;
  if (roles.includes('Super_Admin')) {
    UserReport = <SuperAdminDashboard />;
  } else if (roles.includes('Admin') || roles.includes('Manager')) {
    UserReport = <ManagerReport />;
  } else {
    UserReport = <EmployeeReport />;
  }

  return UserReport;
};

const Report = () => {
  const [generateReport, setGenerateReport] = useState(false);

  const handleOpenModal = () => {
    setGenerateReport(true);
  };

  const handleCloseModal = () => {
    setGenerateReport(false);
  };
  return (
    <PageContainer
      back={false}
      title="Report Dashboard"
      rightOption={
        <DrogaButton
          variant="contained"
          title={'Generate Report'}
          onPress={() => handleOpenModal()}
        />
      }
    >
      <Grid container>
        <Grid item xs={12} sx={{ px: 1.6 }}>
          <ActiveUser />
        </Grid>
      </Grid>

      <ExportReport
        open={generateReport}
        handleClose={() => handleCloseModal()}
      />
    </PageContainer>
  );
};

Report.propTypes = {};

export default Report;
