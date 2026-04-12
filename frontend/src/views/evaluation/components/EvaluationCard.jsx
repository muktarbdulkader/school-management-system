import React from 'react';
import { Box, Grid, Paper, Typography, useTheme } from '@mui/material';
import { MeasuringUnitConverter } from 'utils/function';
import PropTypes from 'prop-types';
import DrogaDonutChart from 'ui-component/charts/DrogaDonutChart';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { gridSpacing } from 'store/constant';

const EvaluationCard = ({ evaluation, onPress, sx }) => {
  const theme = useTheme();
  return (
    <DrogaCard onPress={onPress} sx={{ ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <Typography variant="body1">KPI Name</Typography>
      </Box>
      <Typography variant="h3" color={theme.palette.text.primary} sx={{ marginTop: 0.6 }}>
        {evaluation?.kpi_tracker?.kpi?.name}
      </Typography>

      <Grid container sx={{ paddingTop: 2 }}>
        <Grid item xs={6} sx={{ paddingY: 2.4 }}>
          <Box>
            <Typography variant="body1">Perspective Type</Typography>
            <Typography variant="h4">{evaluation?.kpi_tracker?.kpi?.perspective_type?.name}</Typography>
          </Box>

          <Box sx={{ paddingTop: 2 }}>
            <Typography variant="body1">Measuring Unit</Typography>
            <Typography variant="h4">{evaluation?.kpi_tracker?.kpi?.measuring_unit?.name}</Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
          <DrogaDonutChart value={evaluation?.kpi_tracker?.weight} />
          <Typography variant="subtitle1" color={theme.palette.text.primary} sx={{ marginTop: 2 }}>
            Weight
          </Typography>
        </Grid>
      </Grid>

      <Grid container marginTop={1}>
        <Grid item xs={6}>
          <Box>
            <Typography variant="body1" color={theme.palette.text.primary}>
              Frequency
            </Typography>
            <Typography variant="h4">{evaluation?.period?.frequency?.name}</Typography>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Paper
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 1.6,
              backgroundColor: theme.palette.grey[50]
            }}
          >
            <Typography variant="subtitle1" color={theme.palette.text.primary}>
              Target
            </Typography>
            <Typography variant="h4">
              {evaluation?.kpi_tracker?.total_target}
              {MeasuringUnitConverter(evaluation?.kpi_tracker?.kpi?.measuring_unit?.name)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      <Grid
        container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 3,
          borderTop: 0.8,
          borderColor: theme.palette.divider,
          padding: 0.8,
          paddingTop: 2
        }}
        spacing={gridSpacing}
      >
        <Typography variant="h4" color={theme.palette.text.primary}>
          Quarter 1
        </Typography>

        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" color={theme.palette.text.primary}>
            Targeted
          </Typography>
          <Box sx={{ padding: 1, m: 1, backgroundColor: theme.palette.grey[50], borderRadius: 2 }}>
            <Typography variant="h4" color={theme.palette.text.primary}>
              {evaluation?.target}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" color={theme.palette.text.primary}>
            Evaluated
          </Typography>
          <Box sx={{ padding: 1, m: 1, backgroundColor: theme.palette.grey[50], borderRadius: 2 }}>
            <Typography variant="h4" color={theme.palette.text.primary}>
              {evaluation?.actual_value}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

EvaluationCard.propTypes = {
  evaluation: PropTypes.object,
  onPress: PropTypes.func,
  sx: PropTypes.object
};
export default EvaluationCard;
