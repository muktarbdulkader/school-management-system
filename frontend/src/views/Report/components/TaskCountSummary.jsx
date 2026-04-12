import React from 'react';
import PropTypes from 'prop-types';
import { IconClipboardList } from '@tabler/icons-react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import DrogaCard from 'ui-component/cards/DrogaCard';
import { getStatusColor } from 'utils/function';

const TaskCountSummary = ({ data }) => {
  const theme = useTheme();
  return (
    <>
      <Grid container spacing={2} sx={{ display: 'flex' }}>
        <Grid item xs={6}>
          <DrogaCard>
            <IconClipboardList size="1.6rem" stroke="1.4" />
            <Box sx={{ display: 'flex', alignItems: 'flex-end', my: 1 }}>
              <Typography variant="h1" color={theme.palette.primary[800]} mr={1}>
                {data?.weekly_task_count}
              </Typography>
              <Typography variant="subtitle1" color="text.primary">
                Tasks
              </Typography>
            </Box>

            <Typography variant="body1">
              Achieved:{' '}
              <b>
                {data?.completed_task_count}/{data?.weekly_task_count}
              </b>
            </Typography>
          </DrogaCard>
        </Grid>
        <Grid item xs={6}>
          <DrogaCard>
            <IconClipboardList size="1.6rem" stroke="1.4" />
            <Box sx={{ display: 'flex', alignItems: 'flex-end', my: 1 }}>
              <Typography variant="h1" color="#FFA500" mr={1}>
                {data?.weekly_sub_task_count}
              </Typography>
              <Typography variant="subtitle1" color="text.primary">
                Subtasks
              </Typography>
            </Box>

            <Typography variant="body1">
              Achieved:{' '}
              <b>
                {data?.completed_sub_task_count}/{data?.weekly_sub_task_count}
              </b>
            </Typography>
          </DrogaCard>
        </Grid>

        <Grid container>
          <Grid item xs={12} sx={{ pl: 2 }}>
            <Typography variant="h4" color="text.primary" mt={3} mb={3} ml={1}>
              Per Status Report
            </Typography>

            <>
              {data?.task_status_counts &&
                Object.entries(data?.task_status_counts).map(([status, count], index) => (
                  <DrogaCard key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 1 }}>
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }} color="text.primary">
                      {status}
                    </Typography>

                    <Typography
                      variant="subtitle1"
                      sx={{
                        minWidth: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: status === 'pending' ? '#006BE1' : status === 'in-progress' ? '#FFA500' : getStatusColor(status),
                        color: theme.palette.common.white,
                        borderRadius: '50%',
                        px: 1
                      }}
                    >
                      {count}
                    </Typography>
                  </DrogaCard>
                ))}
            </>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

TaskCountSummary.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default TaskCountSummary;
