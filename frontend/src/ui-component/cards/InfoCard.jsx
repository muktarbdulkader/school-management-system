import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import { AnalyticsDonut } from 'ui-component/charts/AnalyticsDonut';

const InfoCard = ({ detailLabel, detailCounts }) => {
  return (
    <Grid container sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between' }}>
      <Grid item xs={12} sm={12} pl={2}>
        <AnalyticsDonut
          title={detailLabel}
          chart={{
            series: detailCounts || []
          }}
        />
      </Grid>
    </Grid>
  );
};

InfoCard.propTypes = {
  unit_count: PropTypes.number,
  label: PropTypes.string,
  detailLabel: PropTypes.string,
  detailCounts: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
};

export default InfoCard;
