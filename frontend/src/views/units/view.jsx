import React from 'react';
import { useLocation } from 'react-router-dom';
import PageContainer from 'ui-component/MainPage';
import UnitTabComponent from './components/TabChildrens/UnitTabs';

const ViewUnit = () => {
  const { state } = useLocation();

  return (
    <PageContainer back={true} title={state?.name || 'Unit Details'}>
      <UnitTabComponent id={state?.id} />
    </PageContainer>
  );
};

export default ViewUnit;
