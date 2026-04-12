import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Grid } from '@mui/material';
import PageContainer from 'ui-component/MainPage';
import BasicDetails from './components/BasicDetails';
import ChangePassword from './components/ChangePassword';
import Backend from 'services/backend';
import Fallbacks from 'utils/components/Fallbacks';
import GetToken from 'utils/auth-token';
import { toast } from 'react-toastify';

const Account = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleGettingProfile = async () => {
      const token = await GetToken('token');
      const Api = Backend.api + Backend.myProfile;
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
          console.error(error)
          toast(error.message);
          setError(true);
          setLoading(false);
        });
    };

    handleGettingProfile();
    return () => { };
  }, []);
  return (
    <PageContainer title="Account">
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
              <CircularProgress size={22} />
            </Box>
          ) : error ? (
            <Fallbacks severity="error" title="Server error" description="There is error fetching user profile" />
          ) : data.length === 0 ? (
            <Fallbacks severity="account" title="Unable to fetch user information" description="" sx={{ paddingTop: 6 }} />
          ) : (
            <>
              <BasicDetails userInfo={data} />
              <ChangePassword />
            </>
          )}
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Account;
