import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PropTypes from 'prop-types';

export const EmployeeKPI = ({ kpi_name, kpi_perspective, weight, onPress }) => {
  const theme = useTheme();
  return (
    <DrogaCard
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginY: 1,
        cursor: 'pointer',
        ':hover': { backgroundColor: theme.palette.grey[50] }
      }}
      onPress={onPress}
    >
      <Box sx={{ maxWidth: '86%' }}>
        <Typography
          variant="subtitle1"
          color={theme.palette.text.primary}
          sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {kpi_name}
        </Typography>
        <Typography
          variant="subtitle2"
          color={theme.palette.text.secondary}
          sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {kpi_perspective}
        </Typography>
      </Box>
      <Box>
        <Typography variant="h5" color={theme.palette.text.primary}>
          {weight}%
        </Typography>
      </Box>
    </DrogaCard>
  );
};

EmployeeKPI.propTypes = {
  kpi_name: PropTypes.string,
  weight: PropTypes.number,
  onPress: PropTypes.func
};
