import React from 'react';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import DrogaCard from 'ui-component/cards/DrogaCard';

const ChildEmployees = ({ name, position, employeeID, onPress, hoverColor, planningStatus }) => {
  return (
    <DrogaCard
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        my: 1.4,
        transition: 'all 0.2s ease-out',
        cursor: 'pointer',
        ':hover': {
          backgroundColor: hoverColor
        }
      }}
      onPress={onPress}
    >
      <Box sx={{ maxWidth: '80%' }}>
        {name && (
          <Typography variant="h5" color="text.primary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </Typography>
        )}
        {position && (
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
            {position}
          </Typography>
        )}
      </Box>

      <Box>
        {employeeID && <Typography variant="subtitle2">{employeeID}</Typography>}
        {planningStatus && <Typography variant="subtitle2">{planningStatus} </Typography>}
      </Box>
    </DrogaCard>
  );
};

ChildEmployees.propTypes = {
  name: PropTypes.string,
  manager: PropTypes.string,
  employeeID: PropTypes.string,
  onPress: PropTypes.func
};

export default ChildEmployees;
