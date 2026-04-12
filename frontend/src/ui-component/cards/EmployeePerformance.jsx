import React from 'react';
import { Grid, Typography, useTheme } from '@mui/material';
import DrogaCard from './DrogaCard';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import PropTypes from 'prop-types';

const EmployeePerformance = ({ name, gender, unit, position, children, onView, sx }) => {
  const theme = useTheme();
  return (
    <DrogaCard
      sx={{
        marginY: 1,
        padding: 1.4,
        paddingX: 2,
        ':hover': { transform: 'scale(1.01)', transition: 'all 0.2s ease-in-out', cursor: 'pointer' },
        ...sx
      }}
      onPress={onView}
    >
      <Grid container>
        <Grid item xs={12}>
          <Grid container sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Grid item xs={12} sm={unit ? 3 : 6} md={unit ? 3 : 6} lg={unit ? 3 : 6} xl={unit ? 3 : 6}>
              <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>
                Employee
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.text.primary, marginY: 0.6 }}>
                {name}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                {gender && gender}
              </Typography>
            </Grid>

            {unit && (
              <Grid item xs={12} sm={3} md={3} lg={3} xl={3}>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>
                  Unit
                </Typography>
                <Typography variant="h4" sx={{ color: theme.palette.text.primary, marginY: 1 }}>
                  {unit && unit}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12} sm={3} md={3} lg={3} xl={3}>
              <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>
                Position
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.text.primary, marginY: 1 }}>
                {position && position}
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              sm={3}
              md={3}
              lg={3}
              xl={3}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, padding: 1.6 }}
            >
              <DrogaButton variant="text" color="primary" title="View" onPress={onView} />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          {children}
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

EmployeePerformance.propTypes = {
  name: PropTypes.string,
  gender: PropTypes.string,
  position: PropTypes.string,
  children: PropTypes.node,
  onView: PropTypes.func
};

export default EmployeePerformance;
