import React from 'react';
import PropTypes from 'prop-types';
import { Paper, useTheme } from '@mui/material';

const DrogaDataCard = ({ sx, children, onPress }) => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        backgroundColor: theme.palette.background.default,
        padding: 2,
        border: 1,
        borderColor: theme.palette.divider,
        cursor: 'pointer',
        ':hover': { boxShadow: 1 },
        ...sx
      }}
      onClick={onPress}
    >
      {children}
    </Paper>
  );
};

DrogaDataCard.propTypes = {
  sx: PropTypes.object,
  children: PropTypes.node,
  onPress: PropTypes.func
};
export default DrogaDataCard;
