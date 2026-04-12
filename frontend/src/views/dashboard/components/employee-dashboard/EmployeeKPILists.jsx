import { Box, Typography } from '@mui/material';
import React from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import { EmployeeKPI } from './EmployeeKPI';
import PropTypes from 'prop-types';

export const EmployeeKPILists = ({ isLoading, error, KPIS, navigate }) => {
  return (
    <DrogaCard>
      <Typography variant="h4">Your KPI's</Typography>
      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8
          }}
        >
          <ActivityIndicator size={20} />
        </Box>
      ) : error ? (
        <ErrorPrompt title="Server Error" message="There is error with fetching your kpi" size={140} />
      ) : KPIS.length === 0 ? (
        <Fallbacks severity="tasks" title="" description="Tasks are not found" sx={{ paddingTop: 6 }} />
      ) : (
        <>
          {KPIS.map((kpi, index) => (
            <EmployeeKPI
              key={index}
              kpi_name={kpi.name}
              kpi_perspective={kpi?.perspective}
              weight={kpi.weight}
              onPress={() => navigate('/planning/view', { state: { ...kpi, can_distribute: false } })}
            />
          ))}
        </>
      )}
    </DrogaCard>
  );
};

EmployeeKPILists.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.bool,
  tasks: PropTypes.array,
  navigate: PropTypes.func
};
