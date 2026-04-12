import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { gridSpacing } from 'store/constant';
import { ExportMenu } from 'ui-component/menu/ExportMenu';
import { handleExcelExport } from './PerformanceExport';
import Backend from 'services/backend';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PerformanceCard from 'ui-component/cards/PerformanceCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Fallbacks from 'utils/components/Fallbacks';
import DrogaDonutChart from 'ui-component/charts/DrogaDonutChart';
import PropTypes from 'prop-types';
import EmployeePerKPIPerformance from './EmployeePerKPIPerformance';

const EmployeePerformanceReport = ({ id }) => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [performance, setPerformance] = useState([]);
  const [overallPerformance, setOverallPerformance] = useState({
    overall: 0,
    scale: '',
    color: theme.palette.primary.main
  });

  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const [filter, setFilter] = useState({
    frequencies: 'quarterly'
  });

  const handleFiltering = (event) => {
    const { value, name } = event.target;
    setFilter({ ...filter, [name]: value });
  };

  const handlePeriodSelection = (newPeriod) => {
    if (selectedPeriod && selectedPeriod?.id === newPeriod?.id) {
      setSelectedPeriod(null);
    } else {
      setSelectedPeriod(newPeriod);
    }
  };

  useEffect(() => {
    const handleFetchingPerformance = async () => {
      if (selectedYear?.id) {
        setIsLoading(true);
        const token = await GetToken();
        const Api = Backend.api + Backend.employeePerformance + id + `?fiscal_year_id=${selectedYear?.id}&filter_by=${filter.frequencies}`;

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
              setOverallPerformance((prevState) => ({
                ...prevState,
                overall: response.data.overallSum,
                scale: response.data.scale,
                color: response.data.color
              }));
              setPerformance(response.data.performance);
            }
          })
          .catch((error) => {
            toast.warning(error.message);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    };

    handleFetchingPerformance();
  }, [selectedYear, filter.frequencies]);

  return (
    <Grid item xs={11.9}>
      <Grid container spacing={gridSpacing}>
        <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
          <DrogaCard sx={{ mt: 2 }}>
            <Typography variant="h4">Overall Performance</Typography>
            <Grid container sx={{ marginTop: 2, borderTop: 0.8, borderColor: theme.palette.divider, padding: 2, pb: 1.6 }}>
              {isLoading ? (
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                  <ActivityIndicator size={20} />
                </Box>
              ) : (
                <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <DrogaDonutChart value={parseInt(overallPerformance.overall).toFixed(1)} size={68} color={overallPerformance.color} />
                  <Typography variant="h4" mt={2}>
                    Annual Performance
                  </Typography>
                  {overallPerformance.overall > 0 && <Typography variant="subtitle2">{overallPerformance.scale}</Typography>}
                </Grid>
              )}
            </Grid>
          </DrogaCard>
        </Grid>
        <Grid item xs={12} sm={12} md={6} lg={8} xl={8}>
          <DrogaCard sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, pt: 0 }}>
              <Typography variant="h4" color="text.primary">
                Performances
              </Typography>

              {/* <SelectorMenu
                  name="frequencies"
                  options={reportFrequencies}
                  selected={filter.frequencies}
                  handleSelection={handleFiltering}
                /> */}
              <ExportMenu onExcelDownload={() => handleExcelExport(performance)} />
            </Box>

            <Grid container>
              <Grid item xs={12}>
                {isLoading ? (
                  <Grid container sx={{ borderTop: 0.8, borderColor: theme.palette.divider, padding: 8 }}>
                    <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator size={20} />
                    </Grid>
                  </Grid>
                ) : performance.length > 0 ? (
                  <Grid container sx={{ borderTop: 0.8, borderColor: theme.palette.divider, padding: 1 }}>
                    <Grid
                      item
                      xs={12}
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: filter.frequencies !== 'semi_annual' && 'space-between',
                        mx: 2
                      }}
                    >
                      {performance?.map((period, index) => {
                        const periodName = Object.keys(period)[0];

                        return (
                          <PerformanceCard
                            key={index}
                            isEvaluated={period[periodName].is_evaluated}
                            performance={period[periodName]?.overall}
                            scale={period[periodName]?.scale}
                            color={period[periodName]?.color}
                            frequency={period[periodName].name}
                            onPress={() => handlePeriodSelection(period[periodName])}
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
        </Grid>
      </Grid>
      {selectedPeriod?.id && <EmployeePerKPIPerformance id={id} selectedPeriod={selectedPeriod} filtered_by={filter.frequencies} />}
    </Grid>
  );
};

EmployeePerformanceReport.propTypes = {
  id: PropTypes.string
};

export default EmployeePerformanceReport;
