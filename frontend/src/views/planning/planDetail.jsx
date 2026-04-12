import  { useEffect, useState } from 'react';
import PageContainer from 'ui-component/MainPage';
import PlanCard from './components/PlanCard';
import { gridSpacing } from 'store/constant';
import { Grid } from '@mui/material';
import { useLocation,  } from 'react-router-dom';
import GetToken from 'utils/auth-token';
import Backend from 'services/backend';
import { toast } from 'react-toastify';
import ActivityIndicator from 'ui-component/indicators/ActivityIndicator';
import ErrorPrompt from 'utils/components/ErrorPrompt';

const PlanDetail = () => {
  const { state } = useLocation();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);

//   useEffect(() => {
//     if (!state || !state?.id) {
//       navigate(-1);
//     }
//   }, [state?.id]);

  const handleGettingPlanDetails = async () => {
    setLoading(true);
    const token = await GetToken();
    const Api = Backend.api + Backend.showPlan + '/' + state?.id;
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
          setError(false);
        } else {
          setError(false);
        }
      })
      .catch((error) => {
        toast(error.message);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    handleGettingPlanDetails();
  }, [state?.id]);
  return (
    <PageContainer back={true} title="Plan Details">
      <Grid
        container
        spacing={gridSpacing}
        sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 0.5, padding: 2 }}
      >
        {loading ? (
          <Grid container>
            <Grid
              item
              xs={12}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8
              }}
            >
              <ActivityIndicator size={20} />
            </Grid>
          </Grid>
        ) : data.length === 0 || error ? (
          <ErrorPrompt title="Server Error" message="Unable to retrive plan details" />
        ) : (
          <>
            <Grid item xs={12} sm={12} md={12} lg={4} xl={3}>
              {data.length > 0 && <PlanCard plan={data} hideOptions={true} />}
            </Grid>

            <Grid
              item
              xs={12}
              sm={12}
              md={12}
              lg={7.8}
              xl={8}
              sx={{
                marginTop: 2
              }}
            ></Grid>
          </>
        )}
      </Grid>
    </PageContainer>
  );
};

export default PlanDetail;
