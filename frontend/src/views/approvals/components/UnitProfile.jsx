import { Box, Typography, useTheme } from '@mui/material';
import React from 'react';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PropTypes from 'prop-types';

const UnitProfile = ({ name, managerName, position }) => {
  const theme = useTheme();
  return (
    <Box mt={2}>
      <Typography variant="subtitle1" color={theme.palette.text.primary}>
        Unit
      </Typography>

      <DrogaCard sx={{ border: 0, p: 0 }}>
        {name && (
          <Typography variant="h3" color={theme.palette.text.primary}>
            {name}
          </Typography>
        )}
        {managerName && (
          <>
            <Typography variant="subtitle2" marginTop={1}>
              Manager
            </Typography>
            <Typography variant="h4" color={theme.palette.text.primary}>
              {managerName}
            </Typography>
            <Typography variant="body2" color={theme.palette.text.primary}>
              {position}
            </Typography>
          </>
        )}
      </DrogaCard>
    </Box>
  );
};

UnitProfile.propTypes = {
  name: PropTypes.string,
  managerName: PropTypes.string,
  position: PropTypes.string
};

export default UnitProfile;
