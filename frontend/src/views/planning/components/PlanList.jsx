import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import PlanColumns from 'data/planning/columns';

export const PlanList = ({ plans, isLoading }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{}}>
      <div style={{ width: '100%' }}>
        <DataGrid
          rows={plans}
          columns={PlanColumns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 }
            }
          }}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50, 100]}
          sx={{ cursor: 'pointer', borderRadius: 2, border: 0, minHeight: '71dvh' }}
          onRowClick={(params) => navigate('/planning/view', { state: params.row })}
        />
      </div>
    </Box>
  );
};
PlanList.propTypes = {
  plans: PropTypes.oneOf([PropTypes.object, PropTypes.array])
};
