import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import UnitColumns from 'data/units/column';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

export const UnitList = ({ units }) => {
  const navigate = useNavigate();
  return (
    <Box sx={{ marginTop: 3 }}>
      <div style={{ minHeight: 400, width: '100%' }}>
        <DataGrid
          rows={units}
          columns={UnitColumns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 }
            }
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          sx={{ cursor: 'pointer', borderRadius: 2 }}
          onRowClick={(params) => navigate('/units/view', { state: params.row })}
        />
      </div>
    </Box>
  );
};
UnitList.propTypes = {
  units: PropTypes.oneOf([PropTypes.object, PropTypes.array])
};
