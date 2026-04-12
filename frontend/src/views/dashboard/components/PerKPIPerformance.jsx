import { Typography } from '@mui/material';
import React from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PerKPI from 'ui-component/performance/PerKPI';
import PropTypes from 'prop-types';

const PerKPIPerformance = ({ isLoading, performance }) => {
  return (
    <DrogaCard sx={{ mt: 2 }}>
      <Typography variant="h4">Per KPI performance</Typography>
      <PerKPI isLoading={isLoading} performance={performance} />
    </DrogaCard>
  );
};

PerKPIPerformance.propTypes = {
  isLoading: PropTypes.bool,
  performance: PropTypes.array
};
export default PerKPIPerformance;
