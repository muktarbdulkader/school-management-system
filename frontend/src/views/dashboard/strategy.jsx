import React, { useEffect, useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';

// project imports
import PageContainer from 'ui-component/MainPage';
import ActivitySummary from './components/ActivitySummary';
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { gridSpacing } from 'store/constant';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import { IconArrowsDiagonal, IconBuilding, IconCheck, IconRulerMeasure, IconUsers } from '@tabler/icons-react';
import DashboardSelector from './dashboard-selector';

//  =================================== STRATEGY ROLE ADMIN DASHBOARD ================================

const StrategyDashboard = () => {
  const theme = useTheme();
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [statLoading, setStatLoading] = useState(true);
  const [stats, setStats] = useState([]);

  const handleFetchingStats = async () => {
    setStatLoading(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.getHrCount;

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
          setStats(response.data);
        } else {
          toast.warning(response.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
      })
      .finally(() => {
        setStatLoading(false);
      });
  };

  useEffect(() => {
    handleFetchingStats();
  }, [selectedYear]);
  return (
    <PageContainer title="Dashboard" rightOption={<DashboardSelector />}>
      <Grid container spacing={gridSpacing} sx={{ display: 'flex', alignItems: 'center', mt: 1, pl: 1 }}>
        <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
          <DrogaCard sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {statLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size={20} />
              </Box>
            ) : (
              <React.Fragment>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <IconButton
                    sx={{
                      backgroundColor: theme.palette.primary[800],
                      padding: 1,
                      ':hover': { backgroundColor: theme.palette.primary[800] }
                    }}
                  >
                    <IconRulerMeasure size="1.4rem" stroke="1.8" color="white" />
                  </IconButton>

                  <Box sx={{ marginLeft: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h3" color={theme.palette.primary[800]}>
                        {stats?.total_kpis}
                      </Typography>
                      <Typography variant="subtitle1" color={theme.palette.primary[800]} sx={{ marginLeft: 0.6 }}>
                        KPI's
                      </Typography>
                    </Box>

                    <Typography variant="subtitle1" color={theme.palette.text.primary}>
                      {stats?.perspectiveTypes} Perspectives
                    </Typography>
                  </Box>
                </Box>

                <IconArrowsDiagonal size="1.4rem" stroke="1.8" color="#ccc" />
              </React.Fragment>
            )}
          </DrogaCard>
        </Grid>

        <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
          <DrogaCard sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {statLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size={20} />
              </Box>
            ) : (
              <React.Fragment>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <IconButton
                    sx={{
                      backgroundColor: 'green',
                      padding: 1,
                      ':hover': { backgroundColor: 'green' }
                    }}
                  >
                    <IconCheck size="1.4rem" stroke="1.8" color="white" />
                  </IconButton>

                  <Box sx={{ marginLeft: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h3" color="green">
                        {stats?.used_kpis}
                      </Typography>
                      <Typography variant="subtitle1" color="green" sx={{ marginLeft: 0.6 }}>
                        Planned KPI's
                      </Typography>
                    </Box>

                    <Typography variant="subtitle1" color={theme.palette.text.primary} sx={{ marginLeft: 0.4 }}>
                      KPI Used this year
                    </Typography>
                  </Box>
                </Box>

                <IconArrowsDiagonal size="1.4rem" stroke="1.8" color="#ccc" />
              </React.Fragment>
            )}
          </DrogaCard>
        </Grid>

        <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
          <DrogaCard sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {statLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size={20} />
              </Box>
            ) : (
              <React.Fragment>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <IconButton
                    sx={{
                      backgroundColor: '#8000ff',
                      padding: 1,
                      ':hover': { backgroundColor: '#8000ff' }
                    }}
                  >
                    <IconBuilding size="1.4rem" stroke="1.8" style={{ color: '#fff' }} />
                  </IconButton>

                  <Box sx={{ marginLeft: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h3" color="#8000ff">
                        {stats?.total_units}
                      </Typography>
                      <Typography variant="subtitle1" color="#8000ff" sx={{ marginLeft: 0.6 }}>
                        Units
                      </Typography>
                    </Box>

                    <Typography variant="subtitle1" color={theme.palette.text.primary} sx={{ marginLeft: 0.4 }}>
                      Total
                    </Typography>
                  </Box>
                </Box>

                <IconArrowsDiagonal size="1.4rem" stroke="1.8" color="#ccc" />
              </React.Fragment>
            )}
          </DrogaCard>
        </Grid>

        <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
          <DrogaCard sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {statLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size={20} />
              </Box>
            ) : (
              <React.Fragment>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <IconButton
                    sx={{
                      backgroundColor: '#cc5d02',
                      padding: 1,
                      ':hover': { backgroundColor: '#cc5d02' }
                    }}
                  >
                    <IconUsers size="1.4rem" stroke="1.8" style={{ color: '#fff' }} />
                  </IconButton>

                  <Box sx={{ marginLeft: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h3" color="#cc5d02">
                        {stats?.total_employee}
                      </Typography>
                      <Typography variant="subtitle1" color="#cc5d02" sx={{ marginLeft: 0.6 }}>
                        Employees
                      </Typography>
                    </Box>

                    <Typography variant="subtitle1" color={theme.palette.text.primary} sx={{ marginLeft: 0.4 }}>
                      Total
                    </Typography>
                  </Box>
                </Box>

                <IconArrowsDiagonal size="1.4rem" stroke="1.8" color="#ccc" />
              </React.Fragment>
            )}
          </DrogaCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} mt={1}>
        <ActivitySummary />
      </Grid>

      <ToastContainer />
    </PageContainer>
  );
};

export default StrategyDashboard;
