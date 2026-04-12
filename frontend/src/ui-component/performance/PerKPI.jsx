import { Box, Grid, Typography, useTheme } from '@mui/material';
import React from 'react';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import Fallbacks from 'utils/components/Fallbacks';
import KPICard from './KPICard';

const PerKPI = ({ isLoading, performance }) => {
  const theme = useTheme();
  return (
    <React.Fragment>
      <Grid container sx={{ marginTop: 2, borderTop: 0.8, borderColor: theme.palette.divider, padding: 1 }}>
        <Grid item xs={12}>
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
              <ActivityIndicator size={20} />
            </Box>
          ) : performance.length === 0 ? (
            <Fallbacks
              severity="performance"
              title={`No per KPI performance report`}
              description={`Per KPI performances will be listed here`}
              sx={{ paddingTop: 2 }}
            />
          ) : (
            <React.Fragment>
              {performance?.map((period, index) => {
                const periodName = Object.keys(period)[0];
                const [text, number] = periodName.match(/[a-zA-Z]+|[0-9]+/g);
                const formattedQuarterName = `${text} ${number}`;

                return (
                  <Box key={index} marginY={0.6}>
                    {period[periodName]?.per_kpi.length > 0 && (
                      <React.Fragment>
                        <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                          {formattedQuarterName}
                        </Typography>

                        {period[periodName]?.per_kpi.map((kpi, index) => (
                          <KPICard
                            key={index}
                            kpi={kpi.name}
                            target={kpi.target}
                            actual={kpi.actual_value}
                            performance={parseFloat(kpi.kpi_performance).toFixed(1)}
                          />
                        ))}
                      </React.Fragment>
                    )}
                  </Box>
                );
              })}
            </React.Fragment>
          )}
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default PerKPI;
