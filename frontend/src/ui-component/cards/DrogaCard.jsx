import React from 'react';
import { Paper, useTheme } from '@mui/material';
import PropTypes from 'prop-types';

const DrogaCard = ({ sx, onPress, children, ...props }) => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        backgroundColor: theme.palette.background.paper,
        padding: 2,
        border: theme.palette.mode === 'light' && 0.8,
        borderColor: theme.palette.mode === 'light' && theme.palette.divider,
        ...sx
      }}
      onClick={onPress}
      {...props}
    >
      {children}
    </Paper>
  );
};

DrogaCard.propTypes = {
  sx: PropTypes.object,
  onPress: PropTypes.func,
  children: PropTypes.node
};
export default DrogaCard;
