import React from 'react';
import PageContainer from 'ui-component/MainPage';
import EmployeeTabComponent from './components/EmployeeTabs';
import { useLocation } from 'react-router-dom';

const ViewEmployee = () => {
  const { state } = useLocation();

  return (
    <PageContainer back={true} title={state?.user?.name || 'Employee Details'}>
      <EmployeeTabComponent id={state?.id} />
    </PageContainer>
  );
};

export default ViewEmployee;
