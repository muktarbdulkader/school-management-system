import React, { useEffect, useState } from 'react';
import { Grid, Box, DialogTitle, IconButton, useTheme, Typography } from '@mui/material';
import { IconLabel } from 'ui-component/content/IconLabel';
import { CheckCircle, Person } from '@mui/icons-material';
import { IconUser, IconX } from '@tabler/icons-react';
import { toast, ToastContainer } from 'react-toastify';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import PropTypes from 'prop-types';
import Backend from 'services/backend';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';
import Search from 'ui-component/search';
import FilterEmployees from 'views/employees/components/FilterEmployees';
import DrogaButton from 'ui-component/buttons/DrogaButton';

export const AssignManager = ({ open, handleDialogClose, unit_id, onRefresh }) => {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [search, setSearch] = useState('');

  const [selectedManager, setSelectedManager] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const handleSelection = (coordinator) => {
    if (selectedManager && selectedManager.id == coordinator.id) {
      setSelectedManager(null);
    } else {
      setSelectedManager(coordinator);
    }
  };

  const handleManagerAssignment = async () => {
    setAssigning(true);
    const token = await GetToken();
    var Api = Backend.api + Backend.units + `/` + unit_id;
    const headers = {
      Authorization: `Bearer` + token,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    const data = {
      manager_id: selectedManager.id,
      unit_id: unit_id
    };

    fetch(Api, { method: 'PATCH', headers: headers, body: JSON.stringify(data) })
      .then((response) => response.json())
      .then((response) => {
        if (response.success) {
          setAssigning(false);
          handleDialogClose();
          onRefresh();
          toast.success(response.data.message);
        } else {
          setAssigning(false);
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        setAssigning(false);
        toast.error(error.message);
      });
  };

  const handleSearchFieldChange = (event) => {
    const value = event.target.value;
    setSearch(value);
  };

  const handleFetchingEmployees = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.employees + `?search=${search}`;
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
          setManagers(response.data.data);
        } else {
          toast.warning(response.data.message);
        }
      })
      .catch((error) => {
        toast.warning(error.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleFetchingEmployees();
    }, 600);

    return () => {
      clearTimeout(debounceTimeout);
    };
  }, [search]);

  return (
    <React.Fragment>
      <Dialog open={open} onClose={handleDialogClose}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 2,
            paddingY: 0.6
          }}
        >
          <DialogTitle variant="h4" color={theme.palette.text.primary}>
            Assign Manager
          </DialogTitle>
          <IconButton onClick={handleDialogClose}>
            <IconX size={20} />
          </IconButton>
        </Box>

        <DialogContent sx={{ width: 500, padding: 2, paddinX: 6 }}>
          <Search title="Filter Managers" value={search} onChange={(event) => handleSearchFieldChange(event)} filter={false}>
            <FilterEmployees />
          </Search>

          <Grid container>
            <Grid item xs={12}>
              {loading ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 4
                  }}
                >
                  <ActivityIndicator size={20} />
                </Box>
              ) : (
                <Box sx={{ paddingTop: 2 }}>
                  {managers.length == 0 ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 4
                      }}
                    >
                      <IconUser />
                      <Typography variant="body2">Manager is not found</Typography>
                    </Box>
                  ) : (
                    managers.map((manager) => (
                      <Box
                        key={manager.id}
                        onClick={() => handleSelection(manager)}
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginY: 1,
                          padding: 1.2,
                          border: 1,
                          borderColor: theme.palette.divider,
                          borderRadius: 2,
                          backgroundColor: selectedManager && selectedManager.id === manager.id && theme.palette.grey[50],
                          cursor: 'pointer'
                        }}
                      >
                        <Box>
                          <IconLabel content={manager?.user?.name} label={manager?.user?.email} sx={{ paddinY: 3 }}>
                            <Person fontSize="small" />
                          </IconLabel>
                        </Box>

                        <Box>
                          {selectedManager && selectedManager.id === manager.id && <CheckCircle color="primary" fontSize="small" />}
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <DrogaButton
            title={assigning ? <ActivityIndicator size={16} /> : 'Assign'}
            onPress={() => handleManagerAssignment()}
            disabled={assigning}
          />
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </React.Fragment>
  );
};

AssignManager.propTypes = {
  open: PropTypes.bool,
  handleDialogClose: PropTypes.func,
  unit_id: PropTypes.string,
  onRefresh: PropTypes.func
};
