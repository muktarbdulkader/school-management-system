import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';


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
import SkeletonEarningCard from 'ui-component/cards/Skeleton/EarningCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';

// assets
import PictureAsPdfTwoToneIcon from '@mui/icons-material/PictureAsPdfOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

const KpiTot = ({ isLoading }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [totalKpi, setTotalKpi] = useState(0);
  const [assignedKpi, setAssignedKpi] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchKpiData = () => {
    setLoading(true);

    GetToken().then((token) => {
      const url = Backend.api + Backend.getCount;

      fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setTotalKpi(data.data.used_kpis);

            setAssignedKpi(data.data.my_kpi);
          } else {
            setTotalKpi(0);
            setAssignedKpi(0);
            toast.warning(data.message);
          }
          setLoading(false);
        })
        .catch((error) => {
          setTotalKpi(0);
          setAssignedKpi(0);
          toast.warning(error.message);
          setLoading(false);
        });
    });
  };

  useEffect(() => {
    fetchKpiData();
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
    navigate('/report/KpiDetailView', { state: selectedItem });
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
              <Grid item>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="h3" sx={{ mt: 1.2, color: 'grey.500' }}>
                      KPI
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
              <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.grey[300], marginY: 3 }} />
              <Grid item sx={{ mb: 0.75, cursor: 'pointer' }}>
                <Grid container alignItems="center">
                  <Grid item xs={5}>
                    <Grid container alignItems="center">
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          borderRightWidth: 15,
                          borderColor: 'rgb(77, 173, 127)',
                          mr: 2,
                          height: '9vh'
                        }}
                      />
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          Total KPI
                        </Typography>
                        <Typography sx={{ fontSize: '2.125rem', fontWeight: 500, mr: 1, mt: 0, mb: 0.75 }}>
                          {totalKpi}
                          <Typography component="span" sx={{ fontSize: '0.75rem', verticalAlign: 'sub' }}>
                            Number of KPI
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

                  <Grid item xs={5}>
                    <Grid container alignItems="center">
                      <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                          borderRightWidth: 15,
                          borderColor: 'rgb(234,170,103)',
                          mr: 2,
                          height: '9vh'
                        }}
                      />
                      <Grid item sx={{ mt: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: 'grey.800'
                          }}
                        >
                          Assigned KPI
                        </Typography>
                        <Typography sx={{ fontSize: '2.125rem', fontWeight: 500, mr: 1, mt: 0, mb: 0.75 }}>
                          {assignedKpi}
                          <Typography component="span" sx={{ fontSize: '0.75rem', verticalAlign: 'sub', color: 'grey.500' }}>
                            Number of KPI
                          </Typography>
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

KpiTot.propTypes = {
  isLoading: PropTypes.bool
};

export default KpiTot;
