import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

export const UnitKpi = ({ column, row }) => {
  const navigate = useNavigate();
  return (
    <Box sx={{ marginTop: 3 }}>
      <div style={{ width: '100%' }}>
        <DataGrid
          rows={row}
          columns={column}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 }
            }
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          sx={{ minHeight: '44dvh', borderRadius: 2, border: 0 }}
        />
      </div>
    </Box>
  );
};
UnitKpi.propTypes = {
  units: PropTypes.oneOf([PropTypes.object, PropTypes.array])
};
