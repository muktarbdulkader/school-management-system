import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { leaderboardData, months, weeks } from 'data/report';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import SelectorMenu from 'ui-component/menu/SelectorMenu';
import Backend from 'services/backend';
import GetToken from 'utils/auth-token';
import ErrorPrompt from 'utils/components/ErrorPrompt';
import EachLeaderBoard from './EachLeaderBoard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import { IconTrophyFilled } from '@tabler/icons-react';

const LeaderBoard = () => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);

  const [filter, setFilter] = useState({
    week: '1',
    month: '1'
  });

  const handleFiltering = (event) => {
    const { value, name } = event.target;
    setFilter({ ...filter, [name]: value });
  };

  useEffect(() => {
    const handleFetchingTaskReport = async () => {
      if (selectedYear?.id) {
        setLoading(true);
        const token = await GetToken();
        const Api = Backend.api + Backend.leaderBoard + `?fiscal_year_id=${selectedYear?.id}`;

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
              setData(response.data?.leaderboard);
              setError(false);
            } else {
              setError(true);
            }
          })
          .catch((error) => {
            toast.warning(error.message);
            setError(true);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };

    handleFetchingTaskReport();
  }, [selectedYear]);

  return (
    <Grid container py={2}>
      <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} py={2}>
        <Typography variant="h4">Leader Board</Typography>

        {/* <Box sx={{ display: 'flex' }}>
          <SelectorMenu
            name="month"
            options={months}
            selected={filter.month}
            handleSelection={handleFiltering}
            sx={{ border: 0.4, borderRadius: 2, py: 0, mr: 1.6 }}
          />
          <SelectorMenu
            name="week"
            options={weeks}
            selected={filter.week}
            handleSelection={handleFiltering}
            sx={{ border: 0.4, borderRadius: 2, py: 0 }}
          />
        </Box> */}
      </Grid>
      {!error ? (
        <Grid item xs={11.6}>
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
              <ActivityIndicator size={20} />
            </Box>
          ) : data?.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
              <IconTrophyFilled size="3rem" stroke="1.6" />
              <Typography variant="body1">Weekly leader board report is not available </Typography>
            </Box>
          ) : (
            data?.map((employee, index) => <EachLeaderBoard key={index} rank={index + 1} employee={employee} />)
          )}
        </Grid>
      ) : (
        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ErrorPrompt title="Server Error" message="We have problem retrieving task report" size={160} />
        </Grid>
      )}
    </Grid>
  );
};

LeaderBoard.propTypes = {};

export default LeaderBoard;
