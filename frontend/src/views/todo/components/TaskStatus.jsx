import React from 'react';
import { Box } from '@mui/material';
import StatusSelector from './StatusSelector';

export const TaskStatus = ({ options, item, handleSelection, onActionTaken }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <StatusSelector
        name="status"
        options={options}
        selected={item?.status}
        handleSelection={handleSelection}
        onActionTaken={onActionTaken}
      />
    </Box>
  );
};
