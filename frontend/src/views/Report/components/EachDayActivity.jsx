import { Box, Typography } from '@mui/material';
import React from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PropTypes from 'prop-types';
import { IconCircleCheckFilled } from '@tabler/icons-react';

const EachDayActivity = ({ day, planned, achieved }) => {
  return (
    <DrogaCard
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        marginY: 1.2,
        backgroundColor: planned > 0 && achieved === planned && '#f0fff3'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {planned > 0 && achieved === planned && <IconCircleCheckFilled size="1.2rem" stroke="1.4" style={{ color: 'green' }} />}
        <Typography variant="body2" ml={1.4} color={achieved != planned && 'text.primary'}>
          {day}
        </Typography>
      </Box>

      <Typography variant="h5">
        {achieved}/{planned}
      </Typography>
    </DrogaCard>
  );
};

EachDayActivity.propTypes = {
  day: PropTypes.string,
  planned: PropTypes.number,
  achieved: PropTypes.number
};
export default EachDayActivity;
