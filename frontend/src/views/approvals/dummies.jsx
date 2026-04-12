import React, { useEffect } from 'react';
import { Grid, Typography } from '@mui/material';
import { gridSpacing } from 'store/constant';
import { useLocation, useNavigate } from 'react-router-dom';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';

const ViewApprovalTask = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // const handleFetchingTasks = async () => {
  //   setLoading(true);
  //   const Api =
  //     Backend.api +
  //     Backend.getApprovalTasks +
  //     `?page=${pagination.page}&per_page=${pagination.per_page}&search=${search}&type=${filter.type}&status=${filter.status}`;

  //   const header = {
  //     Authorization: `${ApprovalWorkflow.API_KEY}`,
  //     accept: 'application/json',
  //     'Content-Type': 'application/json'
  //   };

  //   const userRoles = [];
  //   user?.roles?.forEach((role) => userRoles.push({ role_id: role.uuid, role_name: role.name }));

  //   const data = {
  //     user_id: user?.id,
  //     roles: userRoles
  //   };

  //   fetch(Api, {
  //     method: 'POST',
  //     headers: header,
  //     body: JSON.stringify(data)
  //   })
  //     .then((response) => response.json())
  //     .then((response) => {
  //       if (response.success) {
  //         setData(response.data.tasks);
  //         setPagination({ ...pagination, total: response.data.total });
  //         setError(false);
  //       } else {
  //         toast.warning(response.message);
  //       }
  //     })
  //     .catch((error) => {
  //       toast.warning(error.message);
  //       setError(true);
  //     })
  //     .finally(() => {
  //       setLoading(false);
  //     });
  // };

  useEffect(() => {
    if (!state?.id) {
      navigate(-1);
    }
  }, [state?.id]);

  return (
    <PageContainer back={true} title="Task Detail">
      <Grid container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Grid item xs={10} padding={4}>
          <Grid container spacing={gridSpacing}>
            <Grid item xs={12} sm={12} md={7} lg={7} xl={7}>
              <DrogaCard>
                <Typography variant="body2">Task detail page</Typography>
              </DrogaCard>
            </Grid>

            {/* <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
            <DrogaCard sx={{ minHeight: 240 }}>
              <Typography variant="h4">Task Details</Typography>

              {selected && detailData ? (
                <Grid container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loadingDetail ? (
                    <Grid container>
                      <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                        <ActivityIndicator size={20} />
                      </Grid>
                    </Grid>
                  ) : error ? (
                    <ErrorPrompt title="Server Error" message={`There is error retriving task detail`} />
                  ) : detailData.length === 0 ? (
                    <Fallbacks
                      severity="tasks"
                      title={`Tasks details is not found`}
                      description={`The detail of task is shown here`}
                      sx={{ paddingTop: 6 }}
                    />
                  ) : selected?.workflow?.name === 'Planning' ? (
                    <Grid item xs={12}>
                      {detailData?.employee && (
                        <EmployeeProfile name={detailData?.employee?.user?.name} position={detailData?.employee?.position} />
                      )}
                      {detailData?.unit && (
                        <UnitProfile
                          name={detailData?.unit?.name}
                          managerName={detailData?.unit?.manager?.user?.name}
                          position={detailData?.unit?.manager?.position}
                        />
                      )}
                      <Divider sx={{ borderColor: theme.palette.divider, my: 1.4 }} />

                      {detailData?.target && <PlanCard plan={{ ...detailData }} sx={{ border: 0, p: 0.4, my: 3 }} />}
                      {selected?.status === 'pending' && (
                        <React.Fragment>
                          <DrogaButton
                            title="Approve"
                            variant="contained"
                            sx={{
                              backgroundColor: 'green',
                              ':hover': { backgroundColor: 'green' },
                              width: '100%',
                              boxShadow: 0,
                              p: 1.4,
                              marginTop: 2
                            }}
                            onPress={() => handleTaskAction('approved')}
                          />
                          <Grid container mt={1} spacing={gridSpacing}>
                            <Grid item xs={12}>
                              <DrogaButton
                                title="Amend"
                                variant="text"
                                sx={{ width: '100%' }}
                                onPress={() => handleTaskAction('amended')}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <DrogaButton
                                title="Reject"
                                variant="text"
                                color="error"
                                sx={{ width: '100%' }}
                                onPress={() => handleTaskAction('rejected')}
                              />
                            </Grid>
                          </Grid>
                        </React.Fragment>
                      )}
                    </Grid>
                  ) : selected.workflow?.name === 'Evaluation' ? (
                    <Grid item xs={12}>
                      {detailData?.kpi_tracker?.employee && (
                        <EmployeeProfile
                          name={detailData?.kpi_tracker?.employee?.user?.name}
                          position={detailData?.kpi_tracker?.employee?.position}
                        />
                      )}
                      {detailData?.kpi_tracker?.unit && (
                        <UnitProfile
                          name={detailData?.kpi_tracker?.unit?.name}
                          managerName={detailData?.kpi_tracker?.unit?.manager?.user?.name}
                          position={detailData?.kpi_tracker?.unit?.manager?.position}
                        />
                      )}
                      <Divider sx={{ borderColor: theme.palette.divider, my: 1.4 }} />
                      {detailData && <EvaluationCard evaluation={{ ...detailData }} sx={{ border: 0, p: 0.4, my: 3 }} />}

                      {selected?.status === 'pending' && (
                        <React.Fragment>
                          <DrogaButton
                            title="Approve"
                            variant="contained"
                            sx={{
                              backgroundColor: 'green',
                              ':hover': { backgroundColor: 'green' },
                              width: '100%',
                              boxShadow: 0,
                              p: 1.4,
                              marginTop: 2
                            }}
                            onPress={() => handleTaskAction('approved')}
                          />
                          <Grid container mt={1} spacing={gridSpacing}>
                            <Grid item xs={12}>
                              <DrogaButton
                                title="Amend"
                                variant="text"
                                sx={{ width: '100%' }}
                                onPress={() => handleTaskAction('amended')}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <DrogaButton
                                title="Reject"
                                variant="text"
                                color="error"
                                sx={{ width: '100%' }}
                                onPress={() => handleTaskAction('rejected')}
                              />
                            </Grid>
                          </Grid>
                        </React.Fragment>
                      )}
                    </Grid>
                  ) : (
                    <Typography variant="subtitle1"> The task does not have categorized type</Typography>
                  )}
                </Grid>
              ) : (
                <Box sx={{ margin: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <IconClipboardList size="3rem" stroke="1.2" color="grey" />
                  <Typography variant="h4" color={theme.palette.text.primary} mt={1.6}>
                    Selected task detail view
                  </Typography>

                  <Typography variant="subtitle2">The detail of task you choosed shown here</Typography>
                </Box>
              )}
            </DrogaCard>
          </Grid> */}
          </Grid>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default ViewApprovalTask;
