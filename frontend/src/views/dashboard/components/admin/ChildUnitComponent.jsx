import React from 'react';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import DrogaCard from 'ui-component/cards/DrogaCard';

const ChildUnitComponent = ({ name, manager, planningStatus, onPress, hoverColor }) => {
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
      <Box sx={{ maxWidth: '76%' }}>
        {name && (
          <Typography variant="h5" color="text.primary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </Typography>
        )}
        {manager && (
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {manager}
          </Typography>
        )}
      </Box>

      {planningStatus && <Typography variant="subtitle2">{planningStatus} </Typography>}
    </DrogaCard>
  );
};

ChildUnitComponent.propTypes = {
  name: PropTypes.string,
  manager: PropTypes.string,
  planningStatus: PropTypes.string,
  onPress: PropTypes.func
};

export default ChildUnitComponent;
