import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';

// project imports
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import TrendLineChart from 'ui-component/charts/TrendLineChart';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import GetToken from 'utils/auth-token';

const MonthlyTrends = ({ url, title, itshows }) => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const handleGettingMonthlyTrends = async () => {
    try {
      setLoading(true);
      const token = await GetToken();
      const Api = url + `?fiscal_year_id=${selectedYear?.id}`;
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
    handleGettingMonthlyTrends();
  }, [selectedYear?.id, url]);
  return (
    <>
      {loading ? (
        <Box sx={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size={20} />
        </Box>
      ) : (
        <TrendLineChart title={title} data={data} itshows={itshows} />
      )}
    </>
  );
};

export default MonthlyTrends;
