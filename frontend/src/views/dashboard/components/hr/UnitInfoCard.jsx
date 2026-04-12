import React from 'react';
import PropTypes from 'prop-types';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { Grid, Typography, useTheme } from '@mui/material';
import { AnalyticsPie } from 'ui-component/charts/AnalyticsPie';

const UnitInfoCard = ({ unit_count, label, detailLabel, detailCounts }) => {
  const theme = useTheme();

  return (
    <DrogaCard sx={{ width: '100%' }}>
      <Grid container sx={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between' }}>
        <Grid
          item
          xs={12}
          sm={12}
          md={4}
          lg={4}
          xl={4}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: 1,
            borderColor: theme.palette.divider
          }}
        >
          <Typography variant="h2" color="text.primary">
            {unit_count}
          </Typography>
          {label && (
            <Typography variant="subtitle1" color="text.primary">
              Total {label}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={12} md={8} lg={8} xl={8} pl={2}>
          <AnalyticsPie
            title={detailLabel}
            chart={{
              series: detailCounts || []
            }}
          />
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

UnitInfoCard.propTypes = {
  unit_count: PropTypes.number,
  label: PropTypes.string,
  detailLabel: PropTypes.string,
  detailCounts: PropTypes.oneOfType([PropTypes.object, PropTypes.array])
};

export default UnitInfoCard;
