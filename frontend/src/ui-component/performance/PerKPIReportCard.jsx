import React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { gridSpacing } from 'store/constant';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import Fallbacks from 'utils/components/Fallbacks';
import DrogaCard from 'ui-component/cards/DrogaCard';
import DrogaDonutChart from 'ui-component/charts/DrogaDonutChart';

const PerKPIReportCard = ({ isLoading, performance }) => {
  const theme = useTheme();
  return (
    <React.Fragment>
      <Grid
        container
        sx={{
          marginTop: 2,
          borderTop: 0.8,
          borderColor: theme.palette.divider,
          padding: 1,
        }}
      >
        <Grid item xs={12}>
          {isLoading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
              }}
            >
              <ActivityIndicator size={20} />
            </Box>
          ) : performance.length === 0 ? (
            <Fallbacks
              severity="performance"
              title={`Report is not ready`}
              description={`Per KPI performances report is not ready`}
              sx={{ paddingTop: 2, my: 4 }}
            />
          ) : (
            performance.map((kpi, index) => (
              <DrogaCard key={index} sx={{ marginY: 1.4, py: 1.4 }}>
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
                    <Typography variant="h4">{kpi.name}</Typography>
                    <Typography variant="caption">KPI name</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
                    <Typography variant="h4">{kpi.target}</Typography>
                    <Typography variant="caption">Target</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
                    <Typography variant="h4">{kpi.actual_value}</Typography>
                    <Typography variant="caption">Actual</Typography>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={2}
                    lg={2}
                    xl={2}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <DrogaDonutChart
                      value={parseFloat(kpi.kpi_performance).toFixed(1)}
                      size={28}
                      color={kpi?.color}
                    />
                  </Grid>
                </Grid>
              </DrogaCard>
            ))
          )}
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default PerKPIReportCard;
