import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Typography, Grid, Box, Divider, IconButton, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { IconMenu2 } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import DonutChart from 'ui-component/charts/DonutChart';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import Fallbacks from 'utils/components/Fallbacks'; // Ensure you import the Fallbacks component
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PictureAsPdfTwoToneIcon from '@mui/icons-material/PictureAsPdfOutlined';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const CompanyPerformance = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [performance, setPerformance] = React.useState([]);
  const [unitPerformance, setUnitPerformance] = React.useState([]);
  const [selectedUnitPerformance, setSelectedUnitPerformance] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleFetchingPerformance = async () => {
    if (!selectedYear) {
      toast.error('Please select a fiscal year');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const token = await GetToken();
    const url = `${Backend.api}${Backend.myUnitPerformance}?fiscal_year_id=${selectedYear?.id}`;

    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: header
      });

      const data = await response.json();

      if (data.success) {
        setPerformance(data.data.my_unit.performance);

        const childUnitsPerformance = data.data.child_units.map((unit) => {
          let totalPerformance = 0;
          const numQuarters = unit.performance.length;
          for (let i = 0; i < numQuarters; i++) {
            totalPerformance += unit.performance[i][`quarter${i + 1}`].overall;
          }
          const averagePerformance = totalPerformance / numQuarters;

          return {
            unitId: unit.unit.id,
            unitName: unit.unit.name,
            performance: averagePerformance
          };
        });

        setUnitPerformance(childUnitsPerformance);
        setError(false);
      } else {
        toast.warning(data.message);
        setError(true);
      }
    } catch (error) {
      toast.error(error.message);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchingPerformance();
  }, [selectedYear]);

  const calculateAveragePerformance = () => {
    if (performance.length > 0) {
      let totalPerformance = 0;
      const numQuarters = performance.length;

      for (let i = 0; i < numQuarters; i++) {
        totalPerformance += performance[i][`quarter${i + 1}`].overall;
      }

      return totalPerformance / numQuarters;
    }
    return 0;
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(selectedItem);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleUnitPerformanceClick = (unit) => {
    setSelectedUnitPerformance(unit);
    navigate('/report/overall_company', { state: { unitId: unit.unitId, unitName: unit.unitName, performance: unit.performance } });
  };

  return (
    <MainCard border={false} content={false}>
      <Box sx={{ ml: 1 }}>
        {isLoading ? (
          <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={22} />
          </Box>
        ) : error ? (
          <Fallbacks severity="error" title="Server Error" description="Failed to fetch company performance data." />
        ) : unitPerformance.length === 0 ? (
          <Fallbacks severity="info" title="No Data" description="No performance data available for the selected fiscal year." />
        ) : (
          <>
            <Grid container direction="column">
              <Grid item>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="h3" sx={{ mt: 1.2, color: 'grey.500' }}>
                      Company Performance
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
                      <MenuItem>
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
                        <DonutChart value={calculateAveragePerformance()} size={250} label="Ave. Performance" />
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
                        height: '35vh',
                        mr: 5
                      }}
                    />
                  </Grid>

                  <Grid item xs={5}>
                    <Grid container direction="column">
                      {unitPerformance.map((unit, index) => (
                        <Grid container alignItems="center" key={index} onClick={() => handleUnitPerformanceClick(unit)}>
                          <Grid item>
                            <DonutChart value={unit.performance} size={130} colors={['#4dad7f', '#ebebeb']} />
                          </Grid>
                          <Grid item sx={{ mt: 1, ml: 2 }}>
                            <Typography
                              sx={{
                                fontSize: '1rem',
                                fontWeight: 500,
                                color: 'grey.800',
                                mb: 1
                              }}
                            >
                              {unit.unitName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', verticalAlign: 'sub', color: 'grey.500' }}>
                              Scored Performance
                            </Typography>
                          </Grid>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </MainCard>
  );
};

export default CompanyPerformance;
