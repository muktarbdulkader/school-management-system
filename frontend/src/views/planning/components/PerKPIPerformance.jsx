import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Backend from 'services/backend';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PerformanceCard from 'ui-component/cards/PerformanceCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Fallbacks from 'utils/components/Fallbacks';
import PropTypes from 'prop-types';

const PerKPIPerformance = ({ plan }) => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    const handleFetchingPerformance = async () => {
      setIsLoading(true);
      const token = await GetToken();
      const Api = Backend.api + Backend.KPIPerformance + `${plan?.employee_id}/kpi/${plan?.kpi_id}?fiscal_year_id=${selectedYear?.id}`;

      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      };

      fetch(Api, {
        method: 'GET',
        headers: header
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            setPerformance(response.data);
          } else {
            toast.warning(response.message);
          }
        })
        .catch((error) => {
          toast.warning(error.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    handleFetchingPerformance();
  }, [selectedYear]);

  return (
    <DrogaCard>
      <Typography variant="h4">Performance</Typography>

      <Grid container>
        <Grid item xs={12}>
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
              <ActivityIndicator size={20} />
            </Box>
          ) : performance.length > 0 ? (
            <Grid container sx={{ marginTop: 2, borderTop: 0.8, borderColor: theme.palette.divider, padding: 1 }}>
              <Grid item xs={12} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                {performance?.map((period, index) => {
                  const periodName = Object.keys(period)[0];
                  const [text, number] = periodName.match(/[a-zA-Z]+|[0-9]+/g);
                  const formattedQuarterName = `${text} ${number}`;

                  return (
                    <PerformanceCard
                      key={index}
                      isEvaluated={period[periodName].is_evaluated}
                      performance={period[periodName]?.kpi_performance}
                      color={period[periodName]?.color}
                      scale={period[periodName]?.scale}
                      frequency={formattedQuarterName}
                    />
                  );
                })}
              </Grid>
            </Grid>
          ) : (
            <Fallbacks
              severity="performance"
              title={`No performance report`}
              description={`The performance will be listed here`}
              sx={{ paddingTop: 2 }}
            />
          )}
        </Grid>
      </Grid>
    </DrogaCard>
  );
};

PerKPIPerformance.propTypes = {
  plan: PropTypes.string
};
export default PerKPIPerformance;
