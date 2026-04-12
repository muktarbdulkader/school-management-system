import { Grid } from '@mui/material';
import TaskStatus from 'views/dashboard/components/hr/TaskStatus';

const TaskProgress = () => {
  return (
    <Grid container justifyContent="center" pb={4}>
      <Grid item xs={12} sm={12} md={11} lg={10}>
        <TaskStatus />
      </Grid>
    </Grid>
  );
};

export default TaskProgress;
