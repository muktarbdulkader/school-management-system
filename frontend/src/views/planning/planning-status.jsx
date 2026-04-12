import { Grid } from '@mui/material';
import PlanStatus from 'views/dashboard/components/hr/PlanStatus';

const PlanningProgress = () => {
  return (
    <Grid container justifyContent="center" pb={4}>
      <Grid item xs={12} sm={12} md={11} lg={10}>
        <PlanStatus />
      </Grid>
    </Grid>
  );
};

export default PlanningProgress;
