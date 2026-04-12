import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Divider } from '@mui/material';

import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonEarningCard from 'ui-component/cards/Skeleton/EarningCard';
import BarChart from 'ui-component/charts/BarChart';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';

// Fallback component
const FallbackMessage = () => (
  <Typography variant="h6" color="textSecondary" align="center" sx={{ mt: 2 }}>
    Please select a unit to display KPI performance.
  </Typography>
);

const KpiPerformance = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [units, setUnits] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [performance, setPerformance] = useState([]);

  const [selectedUnit, setSelectedUnit] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    last_page: 1,
    total: 0
  });
  const [search, setSearch] = useState('');

  const handleFetchingUnits = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.units + `?page=${pagination.page}&per_page=${pagination.per_page}&search=${search}`;
    const header = {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(Api, {
        method: 'GET',
        headers: header
      });
      const data = await response.json();
      if (data.success) {
        setUnits(data.data.data);
        setPagination({
          ...pagination,
          last_page: data.data.last_page,
          total: data.data.total
        });
        setError(false);
      } else {
        setUnits([]);
        setError(true);
      }
    } catch (error) {
      toast(error.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchingPerformance = async () => {
    if (selectedYear && selectedUnit) {
      setLoading(true);
      const token = await GetToken();
      const url = Backend.api + Backend.unitKpiPerformance + `?unit_id=${selectedUnit}&fiscal_year_id=${selectedYear?.id}`;

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
          const kpiData = data.data.performance_data.map((kpi) => ({
            name: kpi.kpi_name,
            value: kpi.kpi_performance
          }));
          setPerformance(kpiData);
        } else {
          setPerformance([]);
          toast.warning(data.message);
        }
      } catch (error) {
        setPerformance([]);
        toast.warning(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    handleFetchingPerformance();
  }, [selectedUnit, selectedYear]);

  useEffect(() => {
    handleFetchingUnits();
  }, [pagination.page, pagination.per_page, search]);

  const handleUnitChange = (event) => {
    setSelectedUnit(event.target.value);
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
              <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.grey[300], marginY: 3 }} />

              <Grid item>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="h3" sx={{ mt: 1.5, color: 'grey.500' }}>
                      KPI Performance
                    </Typography>
                  </Grid>

                  <Grid item sx={{ textAlign: 'right' }}>
                    <FormControl variant="outlined">
                      <InputLabel id="unit-select-label">Select Unit</InputLabel>
                      <Select
                        labelId="unit-select-label"
                        id="unit-select"
                        value={selectedUnit}
                        onChange={handleUnitChange}
                        label="Select Unit"
                      >
                        {units.map((unit) => (
                          <MenuItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              <Divider sx={{ borderBottom: 0.4, borderColor: theme.palette.grey[300], marginY: 3 }} />

              <Grid item sx={{ mb: 0.75, cursor: 'pointer', mt: 2 }}>
                {selectedUnit ? (
                  <Grid container alignItems="center">
                    <Grid item xs={10}>
                      <Grid container>
                        <Grid item sx={{ mt: 1 }} lg={12}>
                          <BarChart data={performance} />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                ) : (
                  <FallbackMessage />
                )}
              </Grid>
            </Grid>
          </Box>
        </MainCard>
      )}
    </>
  );
};

KpiPerformance.propTypes = {
  isLoading: PropTypes.bool
};

export default KpiPerformance;
