import React from 'react';

import { useLocation } from 'react-router-dom';
import PageContainer from 'ui-component/MainPage';
import TaskEmployee from './TaskEmployee';

const ViewTaskEmployee = () => {
  const { state } = useLocation();

  return (
    <PageContainer back={true} title={state?.name || 'Employee Details'}>
      <TaskEmployee id={state?.id} />
    </PageContainer>
  );
};

export default ViewTaskEmployee;
