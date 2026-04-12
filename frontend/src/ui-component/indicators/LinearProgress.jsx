import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, useTheme } from '@mui/material';

const LinearProgress = ({ value, sx }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '134px', ...sx }}>
      <Box
        sx={{
          height: 5,
          width: '80px',
          backgroundColor: theme.palette.grey[100],
          borderRadius: theme.shape.borderRadius
        }}
      >
        <Box
          sx={{
            height: value > 99 ? 8 : 5,
            width: `${value}%`,
            backgroundColor: value > 99 ? theme.palette.success.dark : theme.palette.primary.main,
            borderRadius: theme.shape.borderRadius
          }}
        ></Box>
      </Box>
      <Typography variant="subtitle2">{value}%</Typography>
    </Box>
  );
};

LinearProgress.propTypes = {
  value: PropTypes.number.isRequired,
  sx: PropTypes.object
};
export default LinearProgress;
