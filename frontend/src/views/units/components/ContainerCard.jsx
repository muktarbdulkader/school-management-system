import { Box, useTheme } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';

const ContainerCard = ({ children }) => {
  const theme = useTheme();
  return <Box sx={{ border: 0.4, borderColor: theme.palette.grey[400], borderRadius: 2, padding: 1, margin: 2 }}>{children}</Box>;
};

ContainerCard.propTypes = {
  children: PropTypes.children
};
export default ContainerCard;
