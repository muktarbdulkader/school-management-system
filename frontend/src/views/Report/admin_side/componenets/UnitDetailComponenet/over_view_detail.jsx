import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonEarningCard from 'ui-component/cards/Skeleton/EarningCard';
import DonutChart from 'ui-component/charts/DonutChart';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import GetFiscalYear from 'utils/components/GetFiscalYear';

// assets

const OverViewDetail = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);
  const location = useLocation();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [sperformance, setPerformance] = React.useState([]);
  const [unitPerformance, setUnitPerformance] = React.useState([]);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [inactiveEmployees, setInactiveEmployees] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Extracting state data from location
  const { unitName, performance } = location.state || {};

  const handleFetchingEmployees = async () => {
    const token = await GetToken();

    const Api = Backend.api + Backend.getEmployees;
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

  const handleFetchingPerformance = async () => {
    if (selectedYear) {
      setIsLoading(true);
      const token = await GetToken();
      const url = Backend.api + Backend.myUnitPerformance + `?fiscal_year_id=${selectedYear?.id}`;

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
              unitName: unit.unit.name,
              performance: averagePerformance
            };
          });

          setUnitPerformance(childUnitsPerformance);
        } else {
          setPerformance([]);
          setUnitPerformance([]);
          toast.warning(data.message);
        }
      } catch (error) {
        setPerformance([]);
        setUnitPerformance([]);
        toast.warning(error.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      return <GetFiscalYear />;
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

      const averagePerformance = totalPerformance / numQuarters;
      return averagePerformance;
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
              <Grid item>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="h3" sx={{ mt: 1.2, color: 'grey.500' }}>
                       {unitName}: Unit Performance
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.grey[300], marginY: 3 }} />
              <Grid item sx={{ mb: 0.75, cursor: 'pointer' }}>
                <Grid container alignItems="center">
                  <Grid item xs={12}>
                    <Grid container justifyContent="center" alignItems="center">
                      <Grid item>
                        <DonutChart value={performance} size={250} label="Ave. Performance" />
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

OverViewDetail.propTypes = {
  isLoading: PropTypes.bool
};

export default OverViewDetail;
