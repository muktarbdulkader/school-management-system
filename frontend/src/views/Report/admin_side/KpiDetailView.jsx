import { useEffect, useState } from 'react';

// material-ui
import { Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';

// project imports
import { gridSpacing } from 'store/constant';
import KpiCard from './componenets/KpiDetailComponenet/kpi';
import KpiTableCard from './componenets/KpiDetailComponenet/kpiTable';
import KpiListCard from './componenets/KpiDetailComponenet/kpiList';

// assets
import PageContainer from 'ui-component/MainPage';
import DrogaCard from 'ui-component/cards/DrogaCard';

const Dashboard = () => {
  const [isLoading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <PageContainer maxWidth="lg" title={'Detail Report'}>
      <DrogaCard sx={{ marginLeft: '10px', padding: '8px', marginTop: '25px' }}>
        <Grid container spacing={gridSpacing}>
          <Grid item xs={12}>
            <Grid container spacing="0">
              <Grid item lg={6} md={6} sm={6} xs={12}>
                {/* <OverviewdetailCard isLoading={isLoading} /> */}
                <KpiCard isLoading={isLoading} />
              </Grid>
              <Grid item xs={0}>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    borderRightWidth: 0.4,
                    borderColor: theme.palette.grey[300],
                    height: '38vh',
                    ml: 1
                  }}
                />
              </Grid>
              <Grid item lg={5.9} md={6} sm={6} xs={12}>
                <KpiListCard isLoading={isLoading} />
                {/* <TotUnitEmployeeCard isLoading={isLoading} /> */}
                {/* <RankingDetail isLoading={isLoading} /> */}
              </Grid>
              <Grid item lg={12} md={6} sm={6} xs={12}>
                <KpiTableCard isLoading={isLoading} />

                {/* <TotUnitEmployeeCard isLoading={isLoading} /> */}
                {/* <RankingDetail isLoading={isLoading} /> */}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DrogaCard>
    </PageContainer>
  );
};

export default Dashboard;
