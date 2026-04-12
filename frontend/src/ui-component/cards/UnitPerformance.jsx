import React from 'react';
import { Grid, Typography, useTheme } from '@mui/material';
import DrogaCard from './DrogaCard';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import PropTypes from 'prop-types';

const UnitPerformance = ({ name, unitType, manager, children, onView, sx }) => {
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
            <Grid item xs={12} sm={4} md={4} lg={4} xl={4}>
              <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>
                Unit
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.text.primary, marginY: 0.6 }}>
                {name}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                {unitType && unitType}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4} md={4} lg={4} xl={4}>
              <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary }}>
                Unit Manager
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.text.primary, marginY: 1 }}>
                {manager && manager}
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              sm={4}
              md={4}
              lg={4}
              xl={4}
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

UnitPerformance.propTypes = {
  name: PropTypes.string,
  unitType: PropTypes.string,
  manager: PropTypes.string,
  children: PropTypes.node,
  onView: PropTypes.func
};

export default UnitPerformance;
