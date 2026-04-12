import React, { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  ClickAwayListener,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Popper,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { gridSpacing } from 'store/constant';
import { IconCheck, IconDetails, IconPlus, IconX } from '@tabler/icons-react';
import { toast, ToastContainer } from 'react-toastify';
import { DotMenu } from 'ui-component/menu/DotMenu';
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import Fallbacks from 'utils/components/Fallbacks';
import Transitions from 'ui-component/extended/Transitions';
import MainCard from 'ui-component/cards/MainCard';
import ApprovalWorkflow from 'services/workflow';

const Workflows = () => {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);

  const [stepLoading, setStepLoading] = useState(false);
  const [steps, setSteps] = useState([]);
  const [addingStep, setAddingStep] = useState(false);
  const [stepName, setStepName] = useState('');
  const [open, setOpen] = useState(false);
  const [openedStep, setOpenedStep] = useState(null);
  const lastStep = steps.length > 0 && steps.length - 1;
  const nextStep = steps.length > 0 ? steps[lastStep].step_number + 1 : 1;
  const anchorRef = useRef(null);
  const roleRef = useRef(null);

  const [role, setRole] = useState({
    loading: false,
    roles: [],
    selected: [],
    add: false,
    adding: false
  });

  const [rolePopup, setRolePopup] = useState(false);

  // A functions that handles step and role addition
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleCloseRolePopup = (event) => {
    if (roleRef.current && roleRef.current.contains(event.target)) {
      return;
    }
    setRolePopup(false);
  };

  const handleAddingRole = () => {
    setRolePopup((prevOpen) => !prevOpen);
  };

  //workflow step related code goes down here until the next comment
  const handleWorkflowSelection = (item) => {
    setSelected(item);
    handleFetchingSteps(item.id);
  };

  const handleStepSelection = (step) => {
    if (openedStep?.id === step.id) {
      setOpenedStep(null);
      setRole({ ...role, selected: [] });
    } else {
      setOpenedStep(step);
      if (role.roles.length === 0) {
        handleFetchingRoles();
      }
    }
    setRolePopup(false);
  };

  const handleStepNameChange = (event) => {
    const value = event.target.value;
    setStepName(value);
  };

  const handleStepSubmission = (event) => {
    event.preventDefault();
    if (stepName.length < 3) {
      toast.error('Step name minimum length must be combination of three words');
    } else {
      setAddingStep(true);
      const Api = ApprovalWorkflow.api + ApprovalWorkflow.steps;
      const headers = {
        Authorization: `${ApprovalWorkflow.API_KEY}`,
        accept: 'application/json',
        'Content-Type': 'appliaction/json'
      };

      const data = {
        name: stepName,
        step_number: nextStep,
        workflow_id: selected?.id
      };

      fetch(Api, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      })
        .then((response) => response.json())
        .then((response) => {
          if (response.success) {
            toast.success(response.message);
            handleFetchingSteps(selected.id);
            setOpen(false);
          } else {
            toast.error(response.error);
          }
        })
        .catch((error) => {
          toast.error(error.message);
        })
        .finally(() => {
          setAddingStep(false);
        });
    }
  };

  const handleRemovingStep = async (step) => {
    setStepLoading(true);

    const Api = ApprovalWorkflow.api + ApprovalWorkflow.steps + `/${step?.id}`;
    const headers = {
      Authorization: `${ApprovalWorkflow.API_KEY}`,
      'Content-Type': 'application/json'
    };

    fetch(Api, { method: 'DELETE', headers: headers })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.message);
          handleFetchingSteps(selected.id);
        } else {
          toast.error(response.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setStepLoading(false);
      });
  };

  //Approving role related code goes down here
  const handleRoleSelection = (event, value) => {
    setRole({ ...role, selected: value });
  };

  const handleRemoveRole = (role) => {
    setStepLoading(true);
    const Api = ApprovalWorkflow.api + ApprovalWorkflow.unAssignRole;
    const headers = {
      Authorization: `${ApprovalWorkflow.API_KEY}`,
      'Content-Type': 'application/json'
    };

    const data = {
      step_id: openedStep?.id,
      role_id: role?.role_id
    };

    fetch(Api, { method: 'POST', headers: headers, body: JSON.stringify(data) })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.message);
          handleFetchingSteps(selected.id);
        } else {
          toast.error(response.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setStepLoading(false);
      });
  };

  const handleRoleSubmission = (event) => {
    event.preventDefault();

    setRolePopup(false);
    setRole({ ...role, adding: true });
    const Api = ApprovalWorkflow.api + ApprovalWorkflow.assignRole;
    const headers = {
      Authorization: `${ApprovalWorkflow.API_KEY}`,
      accept: 'application/json',
      'Content-Type': 'appliaction/json'
    };

    const selectedRoles = [];
    role.selected.forEach((role) => selectedRoles.push({ role_id: role.uuid, role_name: role.name }));
    const data = {
      roles: selectedRoles,
      step_id: openedStep?.id
    };

    fetch(Api, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          toast.success(response.message);
          setRole({ ...role, selected: [] });
          handleFetchingSteps(selected?.id);
        } else {
          toast.error(response.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setRole({ ...role, adding: false });
      });
  };

  //Data fetching methods
  const handleFetchingWorkflows = async () => {
    setLoading(true);
    const Api = ApprovalWorkflow.api + ApprovalWorkflow.id + '/workflows';
    const header = {
      Authorization: `${ApprovalWorkflow.API_KEY}`,
      accept: 'application/json'
    };

    fetch(Api, {
      method: 'GET',
      headers: header
    })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setData(response?.data?.applicationWorkflows?.workflows);
          selected && setSelected(response?.data?.applicationWorkflows?.workflows?.filter((workflow) => workflow.id === selected.id));
          setError(false);
        } else {
          toast.warning(response.data.message);
          setError(false);
        }
      })
      .catch((error) => {
        toast.error(error.message);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleFetchingSteps = async (id) => {
    setStepLoading(true);

    const Api = ApprovalWorkflow.api + ApprovalWorkflow.steps + `/${id}`;
    const header = {
      Authorization: `${ApprovalWorkflow.API_KEY}`,
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
          const w_steps = response.data && response.data.steps.sort((a, b) => a.step_number - b.step_number);
          setSteps(w_steps);
        } else {
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
      })
      .finally(() => {
        setStepLoading(false);
      });
  };

  const handleFetchingRoles = async () => {
    const token = await GetToken();
    const Api = Backend.auth + Backend.roles;
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
          setRole({ ...role, roles: response.data });
        }
      })
      .catch((error) => {
        toast(error.message);
      });
  };

  useEffect(() => {
    handleFetchingWorkflows();
  }, []);

  return (
    <PageContainer title="Approval Workflows">
      <Grid container padding={2.5}>
        <Grid item xs={12}>
          <Grid container spacing={gridSpacing} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
              <DrogaCard>
                <Box>
                  <Typography variant="h4">Workflows</Typography>
                </Box>

                {loading ? (
                  <Grid container>
                    <Grid
                      item
                      xs={12}
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 8
                      }}
                    >
                      <ActivityIndicator size={20} />
                    </Grid>
                  </Grid>
                ) : error ? (
                  <ErrorPrompt title="Server Error" message="Unable to retrive workflows" size={120} />
                ) : data.length === 0 ? (
                  <Fallbacks
                    severity="workflow"
                    title="Workflow is not found"
                    description="The list of added workflow will be listed here"
                    sx={{ paddingTop: 6 }}
                    size={40}
                  />
                ) : (
                  <Box sx={{ marginTop: 2 }}>
                    {data.map((item, index) => (
                      <MenuItem
                        key={index}
                        value={item.name}
                        sx={{
                          padding: 1.4,
                          marginY: 1,
                          borderRadius: 2,
                          backgroundColor: selected?.id === item.id && theme.palette.primary.main,

                          ':hover': {
                            backgroundColor: theme.palette.primary.main,
                            '& .MuiTypography-root': { color: 'white' }
                          }
                        }}
                        onClick={() => handleWorkflowSelection(item)}
                      >
                        <Typography
                          variant="subtitle1"
                          color={selected?.id === item.id ? 'white' : theme.palette.text.primary}
                          sx={{ transition: 'color 0.3s' }}
                        >
                          {item.name}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Box>
                )}
              </DrogaCard>
            </Grid>

            <Grid item xs={12} sm={12} md={8} lg={8} xl={8}>
              <DrogaCard>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 2
                  }}
                >
                  <Typography variant="h4"> {selected && selected?.name} Workflow Details</Typography>
                </Box>

                {selected?.id ? (
                  <React.Fragment>
                    <Typography variant="subtitle1" color={theme.palette.text.primary}>
                      Description
                    </Typography>
                    <Typography variant="body2" color={theme.palette.text.primary} sx={{ marginTop: 0.6 }}>
                      {selected?.description}
                    </Typography>

                    {stepLoading ? (
                      <Grid container>
                        <Grid
                          item
                          xs={12}
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 8
                          }}
                        >
                          <ActivityIndicator size={20} />
                        </Grid>
                      </Grid>
                    ) : error ? (
                      <ErrorPrompt title="Server Error" message="Unable to retrive workflows details" size={160} />
                    ) : steps.length === 0 ? (
                      <Fallbacks
                        severity="workflow"
                        title="There is no step in the selected workflow"
                        description="The list of workflow id will be listed here"
                        sx={{ paddingY: 6 }}
                        size={60}
                      />
                    ) : (
                      <React.Fragment>
                        <Typography variant="h4" sx={{ margin: 2, marginTop: 4 }}>
                          Steps
                        </Typography>
                        {selected &&
                          steps.map((step, index) => (
                            <React.Fragment key={index}>
                              <Box sx={{ marginX: 1.4 }}>
                                <DrogaCard onPress={() => handleStepSelection(step)} sx={{ backgroundColor: theme.palette.grey[50] }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle1" color={theme.palette.text.primary}>
                                      Step {step.step_number}
                                    </Typography>
                                    <Typography variant="body2" color={theme.palette.text.primary}>
                                      {step.name}
                                    </Typography>

                                    <DotMenu onDelete={() => handleRemovingStep(step)} />
                                  </Box>
                                </DrogaCard>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderLeft: 1,
                                    borderColor: theme.palette.grey[400],
                                    marginLeft: 3.8
                                  }}
                                >
                                  <Divider orientation="vertical" sx={{ width: 0, height: 20 }} />
                                  {openedStep && openedStep?.id == step.id && (
                                    <Box sx={{ width: '96%', transition: 'all 4s ease' }}>
                                      {step?.roles?.map((approver, index) => (
                                        <Box
                                          key={index}
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginY: 2,
                                            padding: 1,
                                            backgroundColor: theme.palette.grey[100],
                                            width: '100%',
                                            borderTopRightRadius: 4,
                                            borderBottomRightRadius: 4
                                          }}
                                        >
                                          <Typography variant="subtitle1" color={theme.palette.text.primary}>
                                            {approver?.role_name}
                                          </Typography>

                                          <IconButton onClick={() => handleRemoveRole(approver)}>
                                            <IconX size="1rem" stroke="2" style={{ color: theme.palette.grey[500] }} />
                                          </IconButton>
                                        </Box>
                                      ))}

                                      <>
                                        <Popper
                                          placement="bottom-start"
                                          open={rolePopup}
                                          anchorEl={roleRef.current}
                                          transition
                                          disablePortal
                                          popperOptions={{
                                            modifiers: [
                                              {
                                                name: 'offset',
                                                options: {
                                                  offset: [0, 4]
                                                }
                                              }
                                            ]
                                          }}
                                        >
                                          {({ TransitionProps }) => (
                                            <Transitions in={rolePopup} {...TransitionProps}>
                                              <ClickAwayListener onClickAway={handleCloseRolePopup}>
                                                <MainCard
                                                  elevation={8}
                                                  border={true}
                                                  content={false}
                                                  boxShadow
                                                  shadow={theme.shadows[4]}
                                                  sx={{ padding: 0 }}
                                                >
                                                  <DrogaCard sx={{ padding: 1.6, minWidth: 260 }}>
                                                    <form onSubmit={handleRoleSubmission}>
                                                      <Box
                                                        sx={{
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          justifyContent: 'space-between',
                                                          marginBottom: 2
                                                        }}
                                                      >
                                                        <Typography variant="subtitle1" color={theme.palette.text.primary}>
                                                          {' '}
                                                          Add role
                                                        </Typography>
                                                        <IconButton
                                                          sx={{ backgroundColor: theme.palette.grey[50] }}
                                                          type="submit"
                                                          disabled={addingStep}
                                                        >
                                                          {role.adding ? (
                                                            <ActivityIndicator size={16} />
                                                          ) : (
                                                            <IconCheck size="1.2rem" stroke="1.8" />
                                                          )}
                                                        </IconButton>
                                                      </Box>

                                                      <Autocomplete
                                                        id="role-list"
                                                        multiple
                                                        options={role.roles}
                                                        getOptionLabel={(option) => option.name || ''}
                                                        value={role.selected}
                                                        onChange={handleRoleSelection}
                                                        renderTags={(value, getTagProps) =>
                                                          value.map((option, index) => (
                                                            <Chip label={option.name} {...getTagProps({ index })} />
                                                          ))
                                                        }
                                                        fullWidth
                                                        renderInput={(params) => (
                                                          <TextField {...params} label="Select Roles" variant="standard" />
                                                        )}
                                                        disableClearable
                                                      />
                                                    </form>
                                                  </DrogaCard>
                                                </MainCard>
                                              </ClickAwayListener>
                                            </Transitions>
                                          )}
                                        </Popper>
                                        <Box sx={{ display: 'flex', alignItems: 'center', margin: 1, my: 2.6 }}>
                                          <IconButton
                                            title="Add Role"
                                            onClick={handleAddingRole}
                                            sx={{
                                              backgroundColor: theme.palette.grey[50],
                                              marginLeft: 0.6,
                                              cursor: 'pointer',
                                              '& .MuiChip-label': {
                                                lineHeight: 0
                                              }
                                            }}
                                            ref={roleRef}
                                            aria-controls={role.add ? 'role-popup' : undefined}
                                            aria-haspopup="true"
                                          >
                                            <IconPlus size="1rem" stroke="1.8" />
                                          </IconButton>
                                          <Typography variant="body2" color={theme.palette.text.primary} sx={{ marginLeft: 1 }}>
                                            Add role
                                          </Typography>
                                        </Box>
                                      </>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </React.Fragment>
                          ))}
                      </React.Fragment>
                    )}
                  </React.Fragment>
                ) : (
                  <Box
                    sx={{
                      minHeight: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 2
                    }}
                  >
                    <IconDetails size="3.4rem" stroke="1.4" color={theme.palette.warning.dark} />
                    <Typography variant="subtitle1" color={theme.palette.text.disabled}>
                      Worflow Details
                    </Typography>
                  </Box>
                )}

                {selected?.id && (
                  <>
                    <Popper
                      placement="bottom-start"
                      open={open}
                      anchorEl={anchorRef.current}
                      transition
                      disablePortal
                      popperOptions={{
                        modifiers: [
                          {
                            name: 'offset',
                            options: {
                              offset: [0, 4]
                            }
                          }
                        ]
                      }}
                    >
                      {({ TransitionProps }) => (
                        <Transitions in={open} {...TransitionProps}>
                          <ClickAwayListener onClickAway={handleClose}>
                            <MainCard elevation={8} border={true} content={false} boxShadow shadow={theme.shadows[4]} sx={{ padding: 0 }}>
                              <DrogaCard sx={{ padding: 1.6, minWidth: 260 }}>
                                <form onSubmit={handleStepSubmission}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                    <Typography variant="subtitle1" color={theme.palette.text.primary}>
                                      {' '}
                                      Step <b>{nextStep && nextStep}</b>
                                    </Typography>
                                    <IconButton sx={{ backgroundColor: theme.palette.grey[50] }} type="submit" disabled={addingStep}>
                                      {addingStep ? <ActivityIndicator size={16} /> : <IconCheck size="1.2rem" stroke="1.8" />}
                                    </IconButton>
                                  </Box>

                                  <TextField
                                    variant="standard"
                                    placeholder="Step name"
                                    value={stepName}
                                    onChange={handleStepNameChange}
                                    required
                                    fullWidth
                                  />
                                </form>
                              </DrogaCard>
                            </MainCard>
                          </ClickAwayListener>
                        </Transitions>
                      )}
                    </Popper>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        sx={{
                          backgroundColor: theme.palette.grey[100],
                          marginLeft: 2.6,
                          cursor: 'pointer',
                          '& .MuiChip-label': {
                            lineHeight: 0
                          }
                        }}
                        title="Add step"
                        ref={anchorRef}
                        aria-controls={open ? 'menu-list-grow' : undefined}
                        aria-haspopup="true"
                        onClick={handleToggle}
                      >
                        <IconPlus size="1.4rem" stroke="1.8" />
                      </IconButton>
                      <Typography variant="subtitle1" color={theme.palette.text.primary} sx={{ marginLeft: 1 }}>
                        Add Step
                      </Typography>
                    </Box>
                  </>
                )}
              </DrogaCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <ToastContainer />
    </PageContainer>
  );
};

export default Workflows;
