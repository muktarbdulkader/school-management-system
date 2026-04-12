import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { IconMenu2 } from '@tabler/icons-react';
import { Divider } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import SkeletonEarningCard from 'ui-component/cards/Skeleton/EarningCard';

// assets
import PictureAsPdfTwoToneIcon from '@mui/icons-material/PictureAsPdfOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

const EmployeeTot = ({ isLoading }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [inactiveEmployees, setInactiveEmployees] = useState(0);
  const [eligableEmployees, setEligableEmployees] = useState(0);
  const [nonEligableEmployees, setNonEligableEmployees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleFetchingEmployees = async () => {
    const token = await GetToken();

    const Api = Backend.api + Backend.getCount;
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
          setTotalEmployees(response.data.employees);
          setActiveEmployees(response.data.active_employee);
          setInactiveEmployees(response.data.inactive_employee);
          setEligableEmployees(response.data.eligible_employee);
          setNonEligableEmployees(response.data.not_eligible_employee);
          setLoading(false);
          setError(false);
        } else {
          setLoading(false);
          setError(true);
        }
      })
      .catch((error) => {
        toast(error.message);
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    handleFetchingEmployees();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(selectedItem);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };
  const handleView = () => {
    navigate('/report/overall_company', { state: selectedItem });
    handleClose();
  };

  return (
    <>
      {isLoading ? (
        <SkeletonEarningCard />
      ) : (
        <MainCard border={false} content={false}>
          <Box sx={{ ml: 1 }}>
            <Grid container direction="column">
              <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.grey[300], marginY: 3 }} />

              <Grid item>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="h3" sx={{ mt: 1.2, color: 'grey.500' }}>
                      Employee
                    </Typography>
                  </Grid>
                  <Grid item>
                    <IconButton variant="rounded" onClick={handleClick}>
                      <IconMenu2 stroke={1.5} size="1.6rem" color="#195B99" />
                    </IconButton>
                    <Menu
                      id="menu-earning-card"
                      anchorEl={anchorEl}
                      keepMounted
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                      variant="selectedMenu"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                      }}
                    >
                      <MenuItem onClick={handleView}>
                        <VisibilityOutlinedIcon sx={{ mr: 1.75 }} /> View
                      </MenuItem>
                      <MenuItem onClick={handleClose}>
                        <PictureAsPdfTwoToneIcon sx={{ mr: 1.75 }} /> Export
                      </MenuItem>
                    </Menu>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ cursor: 'pointer', mt: 5 }}>
                <Grid container alignItems="center">
                  <Grid item xs={4}>
                    <Grid container alignItems="center">
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          borderRightWidth: 15,
                          borderColor: 'rgb(0,59,115)',
                          mr: 6,
                          ml: 1,
                          height: '9vh'
                        }}
                      />
                      <Grid item>
                        <Typography variant="h4" mt={1}>
                          Total Employee
                        </Typography>
                        <Typography sx={{ fontSize: '2.125rem', fontWeight: 500, mr: 1 }}>
                          {totalEmployees}
                          <Typography component="span" sx={{ fontSize: '0.75rem', verticalAlign: 'sub', color: 'grey.500' }}>
                            Number of Employee
                          </Typography>
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={0}>
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{
                        borderRightWidth: 0.4,
                        borderColor: theme.palette.grey[300],
                        height: '15vh',
                        mr: 5
                      }}
                    />
                  </Grid>

                  {/* <Grid item xs={3}>
                    <Grid container alignItems="center">
                      <Grid item sx={{ ml: 2 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800',
                            mb: 1
                          }}
                        >
                          Active Employee
                        </Typography>
                        <Typography sx={{ fontSize: '24px', verticalAlign: 'sub', color: '#4DAD7F', fontWeight: '900' }}>
                          {activeEmployees}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container alignItems="center">
                      <Grid item sx={{ mt: 1, ml: 2 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800',
                            mb: 1
                          }}
                        >
                          Inactive Employee
                        </Typography>
                        <Typography sx={{ fontSize: '24px', verticalAlign: 'sub', color: '#fe0100', fontWeight: '900' }}>
                          {inactiveEmployees}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid> */}
                  <Grid item xs={0}>
                    {/* <Divider
                      orientation="vertical"
                      flexItem
                      sx={{
                        borderRightWidth: 0.4,
                        borderColor: theme.palette.grey[300],
                        height: '15vh',
                        mr: 5
                      }}
                    /> */}
                  </Grid>
                  <Grid item xs={3}>
                    <Grid container alignItems="center">
                      <Grid item sx={{ ml: 2 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800',
                            mb: 1
                          }}
                        >
                          Eligable
                        </Typography>
                        <Typography sx={{ fontSize: '24px', verticalAlign: 'sub', color: '#4DAD7F', fontWeight: '900' }}>
                          {eligableEmployees}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid container alignItems="center">
                      <Grid item sx={{ mt: 1, ml: 2 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800',
                            mb: 1
                          }}
                        >
                          Non-Eligable
                        </Typography>
                        <Typography sx={{ fontSize: '24px', verticalAlign: 'sub', color: '#fe0100', fontWeight: '900' }}>
                          {nonEligableEmployees}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </MainCard>
      )}
    </>
  );
};

EmployeeTot.propTypes = {
  isLoading: PropTypes.bool
};

export default EmployeeTot;
