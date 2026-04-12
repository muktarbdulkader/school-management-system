import React, { useEffect, useState } from 'react';
import { Box, Grid } from '@mui/material';
import Backend from 'services/backend';
import Fallbacks from 'utils/components/Fallbacks';
import GetToken from 'utils/auth-token';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import EmployeeDetails from './EmployeeDetails';

const EmployeeProfile = ({ id }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleGettingProfile = async () => {
      const token = await GetToken('token');
      const Api = Backend.api + Backend.employeeProfile + id;
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
            setData(response.data);
            setLoading(false);
            setError(false);
          } else {
            setLoading(false);
            setError(false);
          }
        })
        .catch((error) => {
          toast(error.message);
          setError(true);
          setLoading(false);
        });
    };

    handleGettingProfile();
    return () => {};
  }, []);

  return (
    <Grid
      container
      alignItems="center"
      justifyContent={'center'}
      mt={4}
      sx={{ paddingRight: { xs: 2, md: 0 }, paddingBottom: { xs: 10, md: 0 } }}
    >
      <Grid item xs={12} sm={12} md={11.6} lg={11.6}>
        {loading ? (
          <Box sx={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size={22} />
          </Box>
        ) : error ? (
          <Fallbacks severity="error" title="Server error" description="There is error fetching user profile" />
        ) : data.length === 0 ? (
          <Fallbacks severity="profile" title="Unable to fetch user information" description="" sx={{ paddingTop: 6 }} />
        ) : (
          <EmployeeDetails userInfo={data} />
        )}
      </Grid>
    </Grid>
  );
};

export default EmployeeProfile;
