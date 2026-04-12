import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { gridSpacing } from 'store/constant';
import DrogaCard from 'ui-component/cards/DrogaCard';
import PerformerList from './PerformerList';
import SelectorMenu from 'ui-component/menu/SelectorMenu';
import BestPerformerCard from './BestPerformerCard';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import LeaderboardSkeleton from '../skeletons/LeaderboardSkeleton';
import Fallbacks from 'utils/components/Fallbacks';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';

const filterOptions = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' }
];

const EmployeeLeaderboard = () => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState({
    order: 'asc'
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleFiltering = (event) => {
    const { value, name } = event.target;
    setFilter({ ...filter, [name]: value });
  };

  const handleGettingLeaderboard = async (reload) => {
    try {
      reload && setLoading(true);
      const token = await GetToken();
      const Api = Backend.api + Backend.employeeLeaderboard + `?fiscal_year_id=${selectedYear?.id}&order=${filter.order}`;
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
            setData(response.data?.data);
          }
        })
        .catch((error) => {
          toast.error(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    handleGettingLeaderboard(true);
  }, [selectedYear?.id, filter.order]);

  return (
    <Grid item xs={11.7}>
      <Grid container spacing={gridSpacing} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <Grid item xs={11.8}>
          <DrogaCard>
            <Grid container>
              <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h4" mb={1}>
                    Employee Leaderboard
                  </Typography>

                  <SelectorMenu name="order" options={filterOptions} selected={filter.order} handleSelection={handleFiltering} />
                </Box>
                {loading ? (
                  <LeaderboardSkeleton />
                ) : data.length === 0 ? (
                  <Fallbacks severity="leaderboard" title="Top performers report is not ready" description="" sx={{ paddingTop: 6 }} />
                ) : (
                  <PerformerList PerformerData={data} onSelected={(index) => setSelectedIndex(index)} selected={selectedIndex} />
                )}
              </Grid>

              <Grid item xs={12} sm={12} md={6} lg={6} xl={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                {loading ? (
                  <ActivityIndicator size={20} sx={{ mt: 10 }} />
                ) : data.length === 0 ? (
                  <Fallbacks severity="leaderboard" title="Top performers report is not ready" description="" sx={{ paddingTop: 6 }} />
                ) : (
                  <BestPerformerCard employee={data[selectedIndex]} />
                )}
              </Grid>
            </Grid>
          </DrogaCard>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default EmployeeLeaderboard;
