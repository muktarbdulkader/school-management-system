import React, { useEffect, useState } from 'react';
// material-ui
import Grid from '@mui/material/Grid';

// project imports
import { gridSpacing } from 'store/constant';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import {
  IconArrowsDiagonal,
  IconLock,
  IconCheck,
  IconUsers,
  IconUser,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';

import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';

import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import AssignedPermission from './components/AssignedPermission';
import DashboardSelector from './dashboard-selector';

const SuperAdminDashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [statLoading, setStatLoading] = useState(true);
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

  const handleFetchingRole = () => {
    setRoleLoading(true);
    const token = localStorage.getItem('token');
    const Api = `${Backend.auth}${Backend.roles}`;

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
          setRoles(response.data);
        }
        setRoleLoading(false);
      })
      .catch((error) => {
        setRoleLoading(false);
        toast(error.message);
      });
  };

  useEffect(() => {
    handleFetchingRole();
  }, []);
  // useEffect(() => {
  //   handleFetchingStats();
  // }, []);

  return (
    <PageContainer title="Dashboard" rightOption={<DashboardSelector />}>
      <Grid container spacing={gridSpacing} sx={{ margin: 1 }}>
        <Grid item xs={11.6}>
          <Grid
            container
            spacing={gridSpacing}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {/* <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
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
                        <IconUser size="1.4rem" stroke="1.8" color="white" />
                      </IconButton>

                      <Box sx={{ marginLeft: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography
                            variant="h3"
                            color={theme.palette.primary[800]}
                          >
                            {stats?.users}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            color={theme.palette.primary[800]}
                            sx={{ marginLeft: 0.6 }}
                          >
                            Users
                          </Typography>
                        </Box>
                        <Typography
                          variant="subtitle1"
                          color={theme.palette.text.primary}
                          sx={{ marginLeft: 0.4 }}
                        >
                          Total Users
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
            </Grid> */}

            {/* <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
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
                            {stats?.roles}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            color="green"
                            sx={{ marginLeft: 0.6 }}
                          >
                            Roles
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          color={theme.palette.text.primary}
                          sx={{ marginLeft: 0.4 }}
                        >
                          Total Roles
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
            </Grid> */}

            {/* <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
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
                        <IconLock
                          size="1.4rem"
                          stroke="1.8"
                          style={{ color: '#fff' }}
                        />{' '}
                      </IconButton>

                      <Box sx={{ marginLeft: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="h3" color="#8000ff">
                            {stats?.permissions}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            color="#8000ff"
                            sx={{ marginLeft: 0.6 }}
                          >
                            Permissions
                          </Typography>
                        </Box>

                        <Typography
                          variant="subtitle1"
                          color={theme.palette.text.primary}
                          sx={{ marginLeft: 0.4 }}
                        >
                          Total Permissions
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
            </Grid> */}
            {/* <Grid item xs={12} sm={6} md={6} lg={3} xl={3}>
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
                            {stats?.eligible_employee +
                              stats.not_eligible_employee}
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
                          Total Employees
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
            </Grid> */}
          </Grid>

          <Grid
            container
            spacing={gridSpacing}
            marginY={2}
            sx={{ minHeight: 200 }}
          >
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingY: 2,
                }}
              >
                <Box>
                  <Typography variant="h4">
                    Assigned Permission and Role
                  </Typography>
                </Box>
              </Box>

              {loading ? (
                <Grid container>
                  <Grid
                    item
                    xs={12}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                  >
                    <ActivityIndicator size={20} />
                  </Grid>
                </Grid>
              ) : (
                <AssignedPermission assigneperm={roles} />
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default SuperAdminDashboard;
