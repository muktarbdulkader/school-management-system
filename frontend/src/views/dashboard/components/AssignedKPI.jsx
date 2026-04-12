import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { IconTargetArrow } from '@tabler/icons-react';
import { gridSpacing } from 'store/constant';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import DrogaCard from 'ui-component/cards/DrogaCard';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import PlanTable from 'views/evaluation/components/PlanTable';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';

const AssignedKPI = () => {
  const selectedYear = useSelector((state) => state.customization.selectedFiscalYear);
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleFetchingKPITarget = async () => {
      if (selectedYear?.id) {
        setLoading(true);
        const token = await GetToken();
        const Api = Backend.api + Backend.getMyPlans + `?fiscal_year_id=${selectedYear?.id}`;
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
              setData(response.data.plans.data);
              setError(false);
            } else {
              setError(false);
              // toast.warning(response.message);
            }
          })
          .catch((error) => {
            // toast.warning(error.message);
            setError(true);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };
    handleFetchingKPITarget();
  }, []);
  return (
    <Grid item xs={11.9}>
      <Grid container spacing={gridSpacing}>
        <Grid item xs={12}>
          <DrogaCard>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 1,
                paddingLeft: 2
              }}
            >
              <Typography variant="h4">Assigned KPI and Targets</Typography>
            </Box>

            <Box>
              {loading ? (
                <Box sx={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size={20} />
                </Box>
              ) : error ? (
                <Box sx={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2">There is error fetching the assigned kpi's</Typography>
                </Box>
              ) : data.length === 0 ? (
                <Box sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <IconTargetArrow size={80} color={theme.palette.grey[400]} />
                  <Typography variant="h4" sx={{ marginTop: 1.6 }}>
                    Target not found
                  </Typography>
                  <Typography variant="caption">The list of assigned target will be listed here</Typography>
                </Box>
              ) : (
                <PlanTable plans={data} page="employee" />
              )}
            </Box>
          </DrogaCard>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AssignedKPI;
