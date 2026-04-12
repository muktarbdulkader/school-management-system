import React from 'react';
import { Grid, Typography } from '@mui/material';
import { gridSpacing } from 'store/constant';
import DrogaCard from 'ui-component/cards/DrogaCard';
import DrogaDonutChart from 'ui-component/charts/DrogaDonutChart';
import PropTypes from 'prop-types';

const KPICard = ({ kpi, target, actual, performance }) => {
  return (
    <DrogaCard sx={{ marginY: 1 }}>
      <Grid
        container
        spacing={gridSpacing}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
          <Typography variant="subtitle1">{kpi}</Typography>
          <Typography variant="caption">KPI name</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
          <Typography variant="subtitle1">{target}</Typography>
          <Typography variant="caption">Target</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
          <Typography variant="subtitle1">{actual}</Typography>
          <Typography variant="caption">Actual</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={2} lg={2} xl={2}>
          <DrogaDonutChart value={performance} size={30} />
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

KPICard.propTypes = {
  kpi: PropTypes.string,
  target: PropTypes.number,
  actual: PropTypes.number,
  performance: PropTypes.number,
};
export default KPICard;
