import React from 'react';
import { CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';

const ActivityIndicator = ({ size, sx }) => {
  return <CircularProgress size={size} sx={{ ...sx }} />;
};

ActivityIndicator.propTypes = {
  size: PropTypes.number,
  sx: PropTypes.object
};

export default ActivityIndicator;
