import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Divider } from '@mui/material';
import { IconMenu2 } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import PictureAsPdfTwoToneIcon from '@mui/icons-material/PictureAsPdfOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonEarningCard from 'ui-component/cards/Skeleton/EarningCard';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import DonutChart2 from 'ui-component/charts/DonutChart2';

// Define color palette
const colorPalette = [
  '#003B73', // Blue
  '#eaaa67', // Yellow
  '#4dad7f', // Green
  '#fae38f', // Light Yellow
  '#ff6f61', // Coral
  '#6b5b95', // Purple
  '#88b04b', // Olive
  '#f7cac9', // Light Pink
  '#92a8d1', // Light Blue
  '#f7786b' // Salmon
];

const EmployeeInDep = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [unitsData, setUnitsData] = React.useState([]);
  const [isLoading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleFetchingEmployeesInDep = async () => {
    const token = await GetToken();

    const Api = Backend.api + Backend.getEmployeesInDep;
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
          setUnitsData(response.data.child_units);
          setLoading(false);
          setError(false);
        } else {
          setLoading(false);
          setError(true);
        }
      })
      .catch((error) => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    handleFetchingEmployeesInDep();
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

  const chartData = unitsData.map((unit, index) => ({
    name: unit.unit,
    y: unit.employee_count
  }));

  const chartColors = chartData.map((_, index) => colorPalette[index % colorPalette.length]);

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
                      Employee In Department
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
                    <Grid container justifyContent="center" alignItems="center">
                      <Grid item>
                        <DonutChart2 data={chartData} size={250} colors={chartColors} />
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
                        height: '30vh',
                        mr: 5
                      }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: 'grey.800',
                        mb: 3
                      }}
                    >
                      Number of Employees within Departments
                    </Typography>
                    <Grid container spacing={2}>
                      {unitsData.map((unit, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={4} key={index}>
                          <Box
                            sx={{
                              border: '1px solid',
                              borderColor: theme.palette.grey[300],
                              borderRadius: 1,
                              p: 2,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Box
                              sx={{
                                width: 7,
                                height: 30,
                                backgroundColor: chartColors[index % chartColors.length],
                                mr: 1
                              }}
                            />
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  color: 'grey.800',
                                  mb: 0.2
                                }}
                              >
                                {unit.unit}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: 'grey.500' }}>{unit.employee_count} Employees</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
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

EmployeeInDep.propTypes = {
  isLoading: PropTypes.bool
};

export default EmployeeInDep;
