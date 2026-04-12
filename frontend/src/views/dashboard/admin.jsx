import React, { useEffect, useState } from 'react';
// material-ui
import Grid from '@mui/material/Grid';

// project imports
import { gridSpacing } from 'store/constant';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import {
  IconArrowsDiagonal,
  IconBuilding,
  IconCheck,
  IconRulerMeasure,
  IconUsers,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import { YourKPIList } from './components/admin/YourKPIList';
import { ApprovalTaskPanel } from './components/admin/ApprovalTaskPanel';
import ChildUnits from './components/admin/ChildUnits';
import PerformanceReport from 'views/Report/components/PerformanceReport';
import MonthlyTrends from 'views/performance/components/MonthlyTrends';
import DashboardSelector from './dashboard-selector';

const AdminDashboard = () => {
  const theme = useTheme();
  const selectedYear = useSelector(
    (state) => state.customization.selectedFiscalYear,
  );

  const [statLoading, setStatLoading] = useState(false);
  const [stats, setStats] = useState([]);

  const handleFetchingStats = async () => {
    setStatLoading(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.getStats;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };

    fetch(Api, {
      method: 'GET',
      headers: header,
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

  // useEffect(() => {
  //   handleFetchingStats();
  // }, [selectedYear]);

  return (
    <PageContainer title="Dashboard" rightOption={<DashboardSelector />}>
      <Grid container spacing={gridSpacing} mt={1}>
        <Grid item xs={11.6}>
          <Grid
            container
            spacing={gridSpacing}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
              <DrogaCard
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                {statLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator size={20} />
                  </Box>
                ) : (
                  <React.Fragment>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <IconButton
                        sx={{
                          backgroundColor: theme.palette.primary[800],
                          padding: 1,
                          ':hover': {
                            backgroundColor: theme.palette.primary[800],
                          },
                        }}
                      >
                        <IconRulerMeasure
                          size="1.4rem"
                          stroke="1.8"
                          color="white"
                        />
                      </IconButton>

                      <Box sx={{ marginLeft: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography
                            variant="h3"
                            color={theme.palette.primary[800]}
                          >
                            {stats?.kpis}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            color={theme.palette.primary[800]}
                            sx={{ marginLeft: 0.6 }}
                          >
                            KPI's
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          color={theme.palette.text.primary}
                        >
                          {stats?.perspectiveTypes} Perspectives
                        </Typography>
                      </Box>
                    </Box>

                    <IconArrowsDiagonal
                      size="1.4rem"
                      stroke="1.8"
                      color="#ccc"
                    />
                  </React.Fragment>
                )}
              </DrogaCard>
            </Grid>

            <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
              <DrogaCard
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                {statLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator size={20} />
                  </Box>
                ) : (
                  <React.Fragment>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <IconButton
                        sx={{
                          backgroundColor: 'green',
                          padding: 1,
                          ':hover': { backgroundColor: 'green' },
                        }}
                      >
                        <IconCheck size="1.4rem" stroke="1.8" color="white" />
                      </IconButton>

                      <Box sx={{ marginLeft: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h3" color="green">
                            {stats?.used_kpis}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            color="green"
                            sx={{ marginLeft: 0.6 }}
                          >
                            Planned KPI's
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          color={theme.palette.text.primary}
                          sx={{ marginLeft: 0.4 }}
                        >
                          KPI Used this year
                        </Typography>
                      </Box>
                    </Box>

                    <IconArrowsDiagonal
                      size="1.4rem"
                      stroke="1.8"
                      color="#ccc"
                    />
                  </React.Fragment>
                )}
              </DrogaCard>
            </Grid>

            <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
              <DrogaCard
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                {statLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator size={20} />
                  </Box>
                ) : (
                  <React.Fragment>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <IconButton
                        sx={{
                          backgroundColor: '#8000ff',
                          padding: 1,
                          ':hover': { backgroundColor: '#8000ff' },
                        }}
                      >
                        <IconBuilding
                          size="1.4rem"
                          stroke="1.8"
                          style={{ color: '#fff' }}
                        />
                      </IconButton>

                      <Box sx={{ marginLeft: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h3" color="#8000ff">
                            {stats?.units}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            color="#8000ff"
                            sx={{ marginLeft: 0.6 }}
                          >
                            Units
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          color={theme.palette.text.primary}
                          sx={{ marginLeft: 0.4 }}
                        >
                          Total
                        </Typography>
                      </Box>
                    </Box>

                    <IconArrowsDiagonal
                      size="1.4rem"
                      stroke="1.8"
                      color="#ccc"
                    />
                  </React.Fragment>
                )}
              </DrogaCard>
            </Grid>

            <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
              <DrogaCard
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                {statLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ActivityIndicator size={20} />
                  </Box>
                ) : (
                  <React.Fragment>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <IconButton
                        sx={{
                          backgroundColor: '#cc5d02',
                          padding: 1,
                          ':hover': { backgroundColor: '#cc5d02' },
                        }}
                      >
                        <IconUsers
                          size="1.4rem"
                          stroke="1.8"
                          style={{ color: '#fff' }}
                        />
                      </IconButton>

                      <Box sx={{ marginLeft: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h3" color="#cc5d02">
                            {stats?.employees}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            color="#cc5d02"
                            sx={{ marginLeft: 0.6 }}
                          >
                            Employees
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          color={theme.palette.text.primary}
                          sx={{ marginLeft: 0.4 }}
                        >
                          Total
                        </Typography>
                      </Box>
                    </Box>

                    <IconArrowsDiagonal
                      size="1.4rem"
                      stroke="1.8"
                      color="#ccc"
                    />
                  </React.Fragment>
                )}
              </DrogaCard>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={11.6}>
          <Grid
            container
            spacing={2}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
              <YourKPIList />
            </Grid>

            <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
              <ChildUnits />
            </Grid>

            <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
              <ApprovalTaskPanel />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={11.6}>
          <Grid
            container
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
            spacing={gridSpacing}
          >
            <Grid item xs={12} sm={12} md={8} lg={9} xl={9} sx={{ my: 2 }}>
              {/* <MonthlyTrends
                title="Monthly Trends"
                url={Backend.api + Backend.myMonthlyTrends}
                itshows="Performance"
              /> */}
            </Grid>

            <Grid item xs={12} sm={12} md={4} lg={3} xl={3}>
              <Grid container>
                <PerformanceReport hidePerformanceDetail={true} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default AdminDashboard;
