import { useEffect, useState } from 'react';
import { Box, Collapse, Grid, IconButton, Paper, TextField, Typography, useTheme } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import { IconChevronRight, IconChevronUp } from '@tabler/icons-react';
import { useKPI } from 'context/KPIProvider';
import { MeasuringUnitConverter, PeriodNaming } from 'utils/function';
import { useSelector } from 'react-redux';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import DrogaButton from 'ui-component/buttons/DrogaButton';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const TargetDistribution = () => {
  const theme = useTheme();
  const { selectedKpi, distributeTarget } = useKPI();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [expand, setExpand] = useState();
  const SelectFiscalYear = useSelector((state) => state.customization.selectedFiscalYear);

  const handleFrequencySelection = (event, kpi_id, period_id) => {
    const value = event.target.value;
    distributeTarget(value, kpi_id, period_id);
  };

  const handleAccordion = (index, frequency_id) => {
    if (expand === index) {
      setExpand(null);
    } else {
      setExpand(index);
      handleFetchingPeriods(frequency_id);
    }
  };

  const handlePeriodCounts = (index, frequencies) => {
    if (frequencies > 1) {
      return index + 1;
    }
    return '';
  };

  const handleEqualDistribution = (kpi) => {
    const value = kpi?.total_target;
    data && data.forEach((period) => distributeTarget(value, kpi.id, period.id));
  };

  const handleEvenlyDistribution = (kpi) => {
    const value = kpi?.total_target / kpi.f_value;
    data && data.forEach((period) => distributeTarget(value, kpi.id, period.id));
  };

  const handleFetchingPeriods = async (frequency_id) => {
    setLoading(true);
    setData([]);
    const token = await GetToken();
    const Api = Backend.api + Backend.planningPeriods + `?fiscal_year=${SelectFiscalYear?.id}&frequency_id=${frequency_id}&type=planning`;
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
          setData(response.data.periods);
          setLoading(false);
          setError(false);
        } else {
          setLoading(false);
          setError(false);
        }
      })
      .catch((error) => {
        toast.error(error.message);
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    handleFetchingPeriods(selectedKpi[0].frequency_id);
    setExpand(0);
  }, []);

  return (
    <Box>
      {selectedKpi?.map((kpi, index) => (
        <Box key={index} sx={{ marginY: 2 }}>
          <Paper
            sx={{
              padding: 1.6,
              border: 0.6,
              borderColor: theme.palette.divider,
              backgroundColor: theme.palette.primary.light,
              cursor: 'pointer',
              marginY: 0.4
            }}
            onClick={() => handleAccordion(index, kpi.frequency_id)}
          >
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography
                variant="h4"
                sx={{
                  display: '-webkit-box',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: '1.5',
                  maxWidth: '90%'
                }}
              >
                {kpi?.name}
              </Typography>

              <IconButton> {expand === index ? <IconChevronUp size={18} /> : <IconChevronRight size={18} />} </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption"> Total target</Typography>
                <Typography variant="subtitle1" ml={2}>
                  {' '}
                  {kpi?.total_target}
                  {MeasuringUnitConverter(kpi?.mu)}
                </Typography>
              </Box>
              <Box sx={{ ml: 1.2, width: 4, height: 4, borderRadius: '50%', backgroundColor: theme.palette.primary[800] }} />
              <Box sx={{ p: 0.2, px: 1, borderRadius: 20 }}>
                <Typography variant="body2" color="primary.800">
                  {kpi.variation_category}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Collapse in={expand === index}>
            <Box
              sx={{
                padding: 1.6,
                marginY: 0.4
              }}
            >
              <Grid container>
                <Grid item xs={12} sm={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" color={theme.palette.text.primary}>
                      Evaluated
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        backgroundColor: theme.palette.grey[100],
                        color: theme.palette.text.primary,
                        paddingY: 0.4,
                        paddingX: 2,
                        borderRadius: 20,
                        marginLeft: 1
                      }}
                    >
                      {kpi.f_name}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {kpi?.mu === 'Percentage' && (
                    <DrogaButton
                      title={'Equally'}
                      variant="text"
                      onPress={() => handleEqualDistribution(kpi)}
                      disabled={data.length === 0}
                      sx={{ marginRight: 1 }}
                    />
                  )}
                  <DrogaButton title={'Evenly'} variant="text" onPress={() => handleEvenlyDistribution(kpi)} disabled={data.length === 0} />
                </Grid>
              </Grid>

              <Box sx={{ marginTop: 2, minHeight: '10dvh' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                    <ActivityIndicator size={18} />
                  </Box>
                ) : error ? (
                  <Typography variant="subtitle1">Error fetching periods</Typography>
                ) : data.length === 0 ? (
                  <Typography variant="subtitle1">Please set period first</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {data?.map((period, index) => {
                      const targetPeriod = kpi.targets?.find((target) => target.period_id === period.id);

                      return (
                        <Grid item xs={12} sm={6} md={4} key={period.id}>
                          <TextField
                            type="number"
                            label={`${PeriodNaming(kpi?.f_name)} ${handlePeriodCounts(index, kpi.f_value)}`}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={targetPeriod ? targetPeriod.target : ''}
                            onChange={(event) => handleFrequencySelection(event, kpi?.id, period.id)}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Box>
            </Box>
          </Collapse>
        </Box>
      ))}

      <ToastContainer />
    </Box>
  );
};

export default TargetDistribution;
