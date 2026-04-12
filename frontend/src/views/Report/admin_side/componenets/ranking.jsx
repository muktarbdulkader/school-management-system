import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Divider, Box, Grid, Typography, FormControl, Select, MenuItem } from '@mui/material';
import { toast } from 'react-toastify';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonEarningCard from 'ui-component/cards/Skeleton/EarningCard';
import ChartTable from 'ui-component/charts/ChartTable';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import Fallbacks from 'utils/components/Fallbacks';

const Ranking = ({ isLoading }) => {
  const theme = useTheme();
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [view, setView] = useState('Unit');
  const [rankings, setRankings] = useState({ employees: [], units: [] });
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleFetchingRankings = async () => {
    setIsLoadingData(true);
    const token = await GetToken();
    const url = Backend.api + Backend.getRankings + `?fiscal_year_id=${selectedYear?.id}`;

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
        setRankings(data.data.rankings);
      } else {
        setRankings({ employees: [], units: [] });
        toast.warning(data.message);
      }
    } catch (error) {
      setRankings({ employees: [], units: [] });
      toast.warning(error.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    handleFetchingRankings();
  }, [selectedYear]);

  const handleViewChange = (event) => {
    setView(event.target.value);
  };

  const dataToDisplay = view === 'Employee' ? rankings.employees : rankings.units;

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
                      Ranking
                    </Typography>
                  </Grid>

                  <Grid item>
                    <FormControl sx={{ minWidth: 100, marginBottom: '10px' }}>
                      <Select value={view} onChange={handleViewChange}>
                        <MenuItem value="Employee">Employee</MenuItem>
                        <MenuItem value="Unit">Unit</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item sx={{ mb: 0.75, cursor: 'pointer' }}>
                <Grid container alignItems="center">
                  <Grid item xs={12}>
                    <Grid container justifyContent="center" alignItems="center">
                      <Grid item>
                        {dataToDisplay.length > 0 ? (
                          <ChartTable view={view} data={dataToDisplay} isLoading={isLoadingData} />
                        ) : (
                          <Fallbacks
                            severity={view === 'Employee' ? 'error' : 'department'}
                            // message={view === 'Employee' ? 'No Employee Data' : 'No Unit Data'}
                          />
                        )}
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

Ranking.propTypes = {
  isLoading: PropTypes.bool
};

export default Ranking;
